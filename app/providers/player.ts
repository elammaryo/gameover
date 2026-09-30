import { playSpotifyTrack } from '../api'
import type { BeatTrack, SpotifyTrack, Track } from '../models/Track'
import { SpotifyTrack as SpotifyTrackModel } from '../models/Track'
import type { SpotifyState } from '../components/useSpotifyPlayer'
import { BeatEngine, type EngineStatus, type FailReason } from './beatEngine'
import {
  EMPTY_QUEUE,
  currentItem,
  nextRepeat,
  queueReducer,
  type QueueAction,
  type QueueItem,
  type QueueState
} from '@/lib/queue'
import { playerTime } from '@/lib/playerTime'
import { setBeatSource } from '@/lib/beatClock'
import { beatSubtitle } from '@/lib/beats'
import { beatCoverUrl } from '@/lib/coverArt'
import { toast } from '@/lib/toast'

/* ---------------------------------------------------------------------------
   The player: one object for the whole visit that owns the queue, the beat
   engine, Spotify playback and the OS media controls. React reads it
   through useSyncExternalStore (see PlayBarProvider), and every action is
   a plain method, so nothing depends on a render having happened first.

   The rule that keeps it simple: whenever the queue says "(re)start the
   current item" (its playId changes), the current item is loaded. Nothing
   else loads audio.

   Spotify tracks play on the Web Playback SDK. We hand Spotify the run of
   Spotify tracks from the current one onwards; it moves through them by
   itself, and we follow along. If the queue was edited in the meantime,
   or the next item is a beat, we step in at the track change.
--------------------------------------------------------------------------- */

export type PlayerStatus = EngineStatus
export type PlayContext = { id: string; name: string }
export type PlayerState = {
  queue: QueueState
  status: PlayerStatus
  /** lost the connection mid-play; retrying on its own */
  offline: boolean
}
export type PlayerVolume = { level: number; muted: boolean }

const VOLUME_KEY = 'gameover:volume'
/** in a row, before we stop skipping past tracks that won't load */
const MAX_FAILS = 3
const SPOTIFY_RUN = 50
/** "previous" restarts the track once it's this far in (seconds) */
const PREV_RESTARTS_AFTER = 3
const SPOTIFY_POLL_MS = 2000

export const isActive = (status: PlayerStatus) =>
  status === 'playing' || status === 'loading'

type SpotifyClock = {
  /** the SDK has reported our current track */
  live: boolean
  paused: boolean
  /** ms, as of `at` */
  position: number
  duration: number
  at: number
  /** a track we asked Spotify for and are waiting on */
  expect: string | null
  expectAt: number
  /** when we started waiting for sound (for the watchdog) */
  loadingSince: number
  /** paused while a start was on its way: pause it again when it lands */
  pauseOnArrival: boolean
  /** bumps on every start, so stale responses are ignored */
  token: number
}

/** Spotify said nothing useful for this long while we wait: give up. */
const SPOTIFY_START_TIMEOUT = 12000

function matchesSpotify(track: Track, s: SpotifyState['track_window']['current_track']) {
  if (!s) return false
  const t = track as SpotifyTrack
  return (
    t.id === s.id ||
    (!!t.uri && t.uri === s.uri) ||
    (!!s.linked_from?.id && t.id === s.linked_from.id) ||
    (!!t.uri && !!s.linked_from?.uri && t.uri === s.linked_from.uri)
  )
}

class Player {
  private state: PlayerState = { queue: EMPTY_QUEUE, status: 'idle', offline: false }
  private volume: PlayerVolume = { level: 0.8, muted: false }
  private listeners = new Set<() => void>()
  private volumeListeners = new Set<() => void>()
  private engine: BeatEngine | null = null
  private started = false
  /** what the listener wants: sound (true) or silence (false) */
  private wantPlay = false
  private fails = 0
  /** uid of the item that was last loaded (restart vs. load) */
  private loadedUid: string | null = null
  private raf = 0
  private pollTimer = 0
  private sp: SpotifyClock = {
    live: false,
    paused: true,
    position: 0,
    duration: 0,
    at: 0,
    expect: null,
    expectAt: 0,
    loadingSince: 0,
    pauseOnArrival: false,
    token: 0
  }
  /** Spotify starts go out one at a time, so they land in order */
  private spChain: Promise<void> = Promise.resolve()
  /** the start request in flight (aborted when a newer one goes out) */
  private spRequest: AbortController | null = null
  /** waiting out a lost connection on this item */
  private net = { uid: '', at: 0, attempt: 0, timer: 0 }

  /* --- store --------------------------------------------------------------- */

  getState = () => this.state
  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }
  getVolume = () => this.volume
  subscribeVolume = (fn: () => void) => {
    this.volumeListeners.add(fn)
    return () => {
      this.volumeListeners.delete(fn)
    }
  }

  private emit() {
    this.listeners.forEach(fn => fn())
  }

  private setStatus(status: PlayerStatus) {
    if (this.state.status === status) return
    this.state = { ...this.state, status }
    if (status === 'playing') {
      this.fails = 0
      this.clearNetworkHold()
      // links go stale after a long pause: keep the next one fresh
      this.prefetchNext()
    }
    this.syncTicking()
    this.syncMediaSessionState()
    this.emit()
  }

  private get current() {
    return currentItem(this.state.queue)
  }

  private currentIs(source: Track['source']) {
    return this.current?.track.source === source
  }

  /* --- lifecycle ------------------------------------------------------------- */

  /** Client only; safe to call again. */
  init() {
    if (this.started || typeof window === 'undefined') return
    this.started = true
    this.restoreVolume()
    this.engine = new BeatEngine({
      onStatus: status => {
        if (!this.currentIs('beat')) return
        // the engine also reports pauses and resumes the system made
        if (status === 'paused') this.wantPlay = false
        else if (status === 'playing') this.wantPlay = true
        this.setStatus(status)
      },
      onEnded: () => {
        if (this.currentIs('beat')) this.ended()
      },
      onFailed: (track, reason, at) => this.failed(track, reason, at),
      onTime: () => {
        this.publishTime()
        this.syncPositionState()
      }
    })
    this.engine.setVolume(this.effectiveVolume())
    this.setupMediaSession()
    window.addEventListener('online', this.handleOnline)
  }

  /* --- playback ---------------------------------------------------------------- */

  /** Play `tracks` from `start`; the list becomes what plays next. */
  play = (
    tracks: Track[],
    start = 0,
    context: PlayContext | null = null,
    opts: { shuffle?: boolean } = {}
  ) => {
    if (!tracks.length) return
    this.init()
    this.gesture(tracks[start] ?? tracks[0])
    this.wantPlay = true
    this.fails = 0
    this.apply({
      type: 'play',
      tracks,
      start,
      context,
      shuffle: opts.shuffle
    })
  }

  /**
   * Call first thing in a click handler that will start playback only after
   * something async (e.g. fetching a playlist): it does the parts browsers
   * only allow inside the tap.
   */
  prime = (source: Track['source'] = 'beat') => {
    this.init()
    this.gesture({ source } as Track)
  }

  toggle = () => this.setPlaying(!isActive(this.state.status))

  setPlaying = (on: boolean) => {
    this.init()
    const item = this.current
    if (!item) return
    this.gesture(item.track)
    this.wantPlay = on

    if (item.track.source === 'beat') {
      const engine = this.engine!
      if (!on) {
        // stop retrying, but remember where it stopped for the next play
        this.pauseNetworkHold()
        engine.pause()
        return
      }
      const beat = item.track as BeatTrack
      const held = this.net.uid === item.uid ? this.net.at : 0
      if (this.state.status === 'error' || held || engine.current?.id !== beat.id) {
        this.fails = 0
        // after a lost connection, carry on from where it stopped
        this.clearNetworkHold()
        this.loadedUid = item.uid
        engine.load(beat, { autoplay: true, at: held })
      } else {
        engine.play()
      }
      return
    }

    const sdk = window.spotifyPlayerInstance
    if (!on) {
      // a start still queued won't go out; one already sent is paused
      // again when it lands
      this.sp.token++
      this.spRequest?.abort()
      if (this.sp.expect) this.sp.pauseOnArrival = true
      sdk?.pause().catch(() => {})
      this.freezeSpotifyClock(true)
      this.setStatus('paused')
      return
    }
    this.sp.pauseOnArrival = false
    if (this.sp.live && sdk && this.state.status !== 'error') {
      this.sp.loadingSince = performance.now()
      this.setStatus('loading')
      const token = this.sp.token
      sdk.resume().catch(() => {
        // only if nothing else happened meanwhile
        if (token === this.sp.token && this.current?.uid === item.uid) {
          this.startSpotify(item, this.spotifyPosition())
        }
      })
    } else {
      this.startSpotify(item, this.spotifyPosition())
    }
  }

  next = () => {
    this.init()
    const q = this.state.queue
    if (!this.current) return
    this.gesture(q.items[q.index + 1]?.track)
    this.wantPlay = true
    this.fails = 0
    this.apply({ type: 'next' })
  }

  prev = () => {
    this.init()
    const q = this.state.queue
    const item = this.current
    if (!item) return
    this.wantPlay = true
    this.fails = 0
    // a few seconds in, "previous" means "from the top" (read the position
    // directly: the displayed time isn't updated in background tabs)
    const at =
      item.track.source === 'beat'
        ? (this.engine?.position ?? 0)
        : this.spotifyPosition() / 1000
    if (at > PREV_RESTARTS_AFTER) {
      this.gesture(item.track)
      this.apply({ type: 'restart' })
      return
    }
    this.gesture(q.items[q.index - 1]?.track ?? item.track)
    this.apply({ type: 'prev' })
  }

  seek = (seconds: number) => {
    const item = this.current
    if (!item || !Number.isFinite(seconds)) return
    if (item.track.source === 'beat') {
      this.engine?.seek(seconds)
      return
    }
    const ms = Math.max(0, seconds * 1000)
    window.spotifyPlayerInstance?.seek(ms).catch(() => {})
    this.sp.position = ms
    this.sp.at = performance.now()
    this.publishTime()
  }

  /** Jump to an item in the queue. */
  jump = (uid: string) => {
    this.init()
    const target = this.state.queue.items.find(i => i.uid === uid)
    if (!target) return
    this.gesture(target.track)
    this.wantPlay = true
    this.fails = 0
    this.apply({ type: 'jump', uid })
  }

  playNext = (track: Track) => {
    this.init()
    const idle = !this.current
    if (idle) {
      this.gesture(track)
      this.wantPlay = true
    }
    this.apply({ type: 'playNext', track })
    if (!idle) toast('Playing next', track.title)
  }

  addToQueue = (track: Track) => {
    this.init()
    const idle = !this.current
    if (idle) {
      this.gesture(track)
      this.wantPlay = true
    }
    this.apply({ type: 'addToQueue', track })
    if (!idle) toast('Added to queue', track.title)
  }

  remove = (uid: string) => {
    this.apply({ type: 'remove', uid })
  }

  /** `uids`: the new order of (the start of) up next. */
  reorder = (uids: string[]) => {
    this.apply({ type: 'reorder', uids })
  }

  /** Clears what you queued yourself; the list you're playing stays. */
  clearQueue = () => {
    this.apply({ type: 'clearUser' })
  }

  toggleShuffle = () => {
    this.apply({ type: 'setShuffle', on: !this.state.queue.shuffle })
  }

  cycleRepeat = () => {
    this.apply({ type: 'setRepeat', mode: nextRepeat(this.state.queue.repeat) })
  }

  stop = () => {
    this.wantPlay = false
    this.apply({ type: 'stop' })
  }

  /* --- volume -------------------------------------------------------------------- */

  setVolume = (level: number) => {
    const v = Math.max(0, Math.min(1, level))
    this.volume = { level: v, muted: v === 0 ? this.volume.muted : false }
    this.applyVolume()
  }

  toggleMute = () => {
    // unmuting at zero would stay silent: bring it back to a sensible level
    this.volume = this.volume.muted
      ? { level: this.volume.level || 0.6, muted: false }
      : { ...this.volume, muted: true }
    this.applyVolume()
  }

  private effectiveVolume() {
    return this.volume.muted ? 0 : this.volume.level
  }

  private applyVolume() {
    const v = this.effectiveVolume()
    this.engine?.setVolume(v)
    window.spotifyPlayerInstance?.setVolume(Math.max(v, 0.0001)).catch(() => {})
    try {
      localStorage.setItem(VOLUME_KEY, JSON.stringify(this.volume))
    } catch {
      // storage unavailable: the level just won't be remembered
    }
    this.volumeListeners.forEach(fn => fn())
  }

  private restoreVolume() {
    try {
      const saved = JSON.parse(localStorage.getItem(VOLUME_KEY) ?? 'null')
      if (saved && typeof saved.level === 'number') {
        this.volume = {
          level: Math.max(0, Math.min(1, saved.level)),
          muted: !!saved.muted
        }
      }
    } catch {
      // keep the default
    }
  }

  /* --- the queue ------------------------------------------------------------------- */

  private apply(action: QueueAction): boolean {
    const prev = this.state.queue
    const next = queueReducer(prev, action)
    if (next === prev) return false
    this.state = { ...this.state, queue: next }
    if (next.playId !== prev.playId) this.loadCurrent()
    else if (currentItem(next)?.uid !== currentItem(prev)?.uid) {
      // moved without a restart (following Spotify): just the metadata
      this.loadedUid = currentItem(next)?.uid ?? null
      this.syncMetadata()
      this.syncSpotifyPolling()
    }
    this.prefetchNext()
    this.emit()
    return true
  }

  /** Load (or restart) whatever the queue says is current. */
  private loadCurrent() {
    const item = this.current
    const engine = this.engine
    this.clearNetworkHold()
    const same = !!item && item.uid === this.loadedUid
    this.loadedUid = item?.uid ?? null

    if (!item) {
      engine?.stop()
      this.leaveSpotify()
      setBeatSource(null)
      this.setStatus('idle')
      playerTime.set(0, 0)
      this.syncMetadata()
      return
    }

    if (item.track.source === 'beat') {
      const beat = item.track as BeatTrack
      this.leaveSpotify()
      if (!engine) return
      if (engine.current?.id === beat.id && this.state.status !== 'error') {
        engine.restart()
      } else {
        playerTime.set(0, 0)
        engine.load(beat, { autoplay: this.wantPlay })
      }
      setBeatSource(engine.audio, beat.bpm)
      this.syncMetadata()
      this.syncSpotifyPolling()
      return
    }

    // Spotify
    engine?.stop()
    setBeatSource(null)
    this.syncMetadata()
    const sdk = window.spotifyPlayerInstance
    if (same && this.sp.live && sdk) {
      // the same track again (repeat one, previous after a few seconds)
      sdk.seek(0).catch(() => {})
      if (this.wantPlay) sdk.resume().catch(() => {})
      this.sp.position = 0
      this.sp.at = performance.now()
      this.publishTime()
      return
    }
    this.startSpotify(item, 0)
  }

  /** Warm up the next beat's link, so skipping is instant. */
  private prefetchNext() {
    const q = this.state.queue
    const next = q.items[q.index + 1]?.track
    if (next?.source === 'beat') this.engine?.prefetch(next as BeatTrack)
  }

  private ended() {
    const moved = this.apply({ type: 'next', auto: true })
    if (moved) return
    // end of the queue: stay on the last track, ready to go again
    this.wantPlay = false
    if (this.currentIs('beat')) {
      this.engine?.pause()
      this.engine?.seek(0)
    } else {
      window.spotifyPlayerInstance?.pause().catch(() => {})
      this.freezeSpotifyClock(true)
      this.sp.position = 0
    }
    this.setStatus('paused')
    this.publishTime()
  }

  private failed(track: BeatTrack, reason: FailReason, at: number) {
    const item = this.current
    if (!item || item.track.id !== track.id) return
    if (reason === 'network') {
      // the connection, not the beat: skipping would only fail again
      this.holdForNetwork(item, at)
      return
    }
    this.fails++
    const q = this.state.queue
    const hasNext =
      q.index + 1 < q.items.length || (q.repeat !== 'off' && q.items.length > 1)
    if (this.wantPlay && hasNext && this.fails < MAX_FAILS) {
      toast('Skipped a beat that wouldn’t load', track.title, 'warn')
      this.apply({ type: 'next' })
      return
    }
    toast(
      this.fails >= MAX_FAILS
        ? 'Playback paused. The connection looks shaky'
        : 'Couldn’t load this beat',
      this.fails >= MAX_FAILS ? 'Press play to try again' : track.title,
      'warn'
    )
  }

  /** Stay on this track and try again with growing gaps (and when back online). */
  private holdForNetwork(item: QueueItem, at: number) {
    if (this.net.uid !== item.uid) {
      window.clearTimeout(this.net.timer)
      this.net = { uid: item.uid, at, attempt: 0, timer: 0 }
      toast('Connection lost', 'It picks up where it stopped when you’re back', 'warn')
    } else if (at > 0) {
      this.net.at = at
    }
    this.setOffline(true)
    if (!this.wantPlay) return
    const delay = Math.min(30_000, 2000 * 2 ** this.net.attempt)
    this.net.attempt++
    window.clearTimeout(this.net.timer)
    this.net.timer = window.setTimeout(this.retryNetwork, delay)
  }

  private retryNetwork = () => {
    const item = this.current
    if (!item || item.uid !== this.net.uid || !this.wantPlay) return
    if (this.state.status !== 'error' || item.track.source !== 'beat') return
    this.engine?.load(item.track as BeatTrack, { autoplay: true, at: this.net.at })
  }

  private clearNetworkHold() {
    window.clearTimeout(this.net.timer)
    this.net = { uid: '', at: 0, attempt: 0, timer: 0 }
    this.setOffline(false)
  }

  /** Paused by the listener mid-hold: no more retries, but keep the spot. */
  private pauseNetworkHold() {
    window.clearTimeout(this.net.timer)
    this.net.timer = 0
    this.net.attempt = 0
    this.setOffline(false)
  }

  private setOffline(offline: boolean) {
    if (this.state.offline === offline) return
    this.state = { ...this.state, offline }
    this.emit()
  }

  private handleOnline = () => {
    // back online after a failure: pick up where we were
    const item = this.current
    if (!item || this.state.status !== 'error' || !this.wantPlay) return
    if (item.uid === this.net.uid) {
      window.clearTimeout(this.net.timer)
      this.retryNetwork()
    } else {
      this.setPlaying(true)
    }
  }

  /**
   * Runs synchronously inside a tap/click: unlocks audio on iOS and lets the
   * Spotify SDK play on mobile browsers.
   */
  private gesture(track?: Track) {
    this.engine?.unlock()
    if (track?.source === 'spotify') {
      window.spotifyPlayerInstance?.activateElement?.().catch(() => {})
    }
  }

  /* --- Spotify ---------------------------------------------------------------------- */

  private startSpotify(item: QueueItem, positionMs: number) {
    const q = this.state.queue
    const run: QueueItem[] = []
    for (let i = q.index; i < q.items.length && run.length < SPOTIFY_RUN; i++) {
      const t = q.items[i].track
      if (t.source !== 'spotify' || !t.uri) break
      run.push(q.items[i])
    }
    const sp = this.sp
    const token = ++sp.token
    sp.pauseOnArrival = false
    sp.expect = item.track.id
    sp.expectAt = performance.now()
    sp.loadingSince = sp.expectAt
    sp.live = false
    sp.paused = true
    sp.position = positionMs
    sp.duration = item.track.duration_ms ?? 0
    sp.at = performance.now()
    this.setStatus('loading')
    this.publishTime()
    if (!run.length) {
      this.spotifyFailed(item)
      return
    }

    // one request at a time, newest wins: a quick "next, next" can't land
    // out of order and leave Spotify on the wrong track. (Requests time out
    // after 8s; past 4s the next one stops waiting for its predecessor.)
    this.spChain = Promise.race([this.spChain, delay(4000)])
      .then(async () => {
        if (token !== sp.token) return
        const ready = await waitForSpotify()
        if (token !== sp.token) return
        if (!ready) {
          this.spotifyFailed(item, 'Spotify isn’t connected yet')
          return
        }
        window.spotifyPlayerInstance
          ?.setVolume(Math.max(this.effectiveVolume(), 0.0001))
          .catch(() => {})
        // a slow earlier request that's still out must not land after this one
        this.spRequest?.abort()
        const request = new AbortController()
        this.spRequest = request
        const ok = await playSpotifyTrack({
          uris: run.map(i => i.track.uri as string),
          offset: 0,
          positionMs,
          signal: request.signal
        })
        if (this.spRequest === request) this.spRequest = null
        if (token !== sp.token) return
        if (!ok) this.spotifyFailed(item)
      })
      .catch(() => {})
    this.syncSpotifyPolling()
  }

  private spotifyFailed(item: QueueItem, message = 'Spotify couldn’t play this') {
    this.sp.expect = null
    // whatever was playing before mustn't carry on under the error
    window.spotifyPlayerInstance?.pause().catch(() => {})
    this.freezeSpotifyClock(true)
    this.setStatus('error')
    toast(message, item.track.title, 'warn')
  }

  /** Leaving Spotify for a beat (or for nothing): silence it. */
  private leaveSpotify() {
    this.sp.token++
    this.spRequest?.abort()
    this.sp.expect = null
    if (this.sp.live || this.sp.expectAt) {
      window.spotifyPlayerInstance?.pause().catch(() => {})
    }
    this.sp.live = false
    this.sp.expectAt = 0
    this.syncSpotifyPolling()
  }

  private spotifyPosition() {
    const sp = this.sp
    return sp.paused ? sp.position : sp.position + (performance.now() - sp.at)
  }

  private freezeSpotifyClock(paused: boolean) {
    this.sp.position = this.spotifyPosition()
    this.sp.at = performance.now()
    this.sp.paused = paused
  }

  /** Every state change the Web Playback SDK reports. */
  onSpotifyState = (s: SpotifyState | null, fromPoll = false) => {
    const item = this.current
    if (!item) {
      // started from the Spotify app onto this browser: show it
      if (s && !s.paused && s.track_window?.current_track) this.adoptSpotify(s)
      return
    }
    if (item.track.source !== 'spotify') {
      // a start that was already on its way when a beat took over
      if (s && !s.paused) window.spotifyPlayerInstance?.pause().catch(() => {})
      return
    }
    const sp = this.sp
    // after a failed start Spotify is paused and its reports don't move the
    // queue (pressing play tries again). A start that landed late anyway is
    // taken as playing; anything else Spotify plays now is silenced
    if (this.state.status === 'error') {
      const t = s?.track_window?.current_track
      if (!s || s.paused || !t) return
      if (matchesSpotify(item.track, t)) {
        Object.assign(sp, {
          expect: null,
          live: true,
          paused: false,
          position: s.position,
          duration: s.duration || t.duration_ms || sp.duration,
          at: performance.now()
        })
        this.wantPlay = true
        this.setStatus('playing')
        this.publishTime()
      } else {
        window.spotifyPlayerInstance?.pause().catch(() => {})
      }
      return
    }

    if (!s) {
      if (fromPoll) return
      // playback moved to another device (or the SDK dropped)
      this.freezeSpotifyClock(true)
      sp.live = false
      if (isActive(this.state.status) && !sp.expect) this.setStatus('paused')
      return
    }

    const track = s.track_window?.current_track
    if (!track) return
    const now = performance.now()

    // waiting for a track we asked for: ignore the old one's last words
    if (sp.expect) {
      const expected = this.state.queue.items.find(i => i.track.id === sp.expect)
      if (expected && !matchesSpotify(expected.track, track)) {
        if (now - sp.expectAt < 8000) return
        sp.pauseOnArrival = false // it never came
      }
      sp.expect = null
    }

    // where the previous track had got to (to tell "ended" from "skipped")
    const before = this.spotifyPosition()
    const nearEnd = sp.duration > 0 && before >= sp.duration - 4000

    // Spotify finished its list and parked (on the last track, or back on
    // the first) paused at 0:00: that's our track ending
    if (!sp.paused && s.paused && s.position === 0 && nearEnd) {
      sp.live = matchesSpotify(item.track, track)
      sp.paused = true
      sp.position = 0
      sp.at = now
      this.ended()
      return
    }

    if (matchesSpotify(item.track, track)) {
      sp.live = true
      sp.position = s.position
      sp.duration = s.duration || track.duration_ms || sp.duration
      sp.at = now
      sp.paused = s.paused
      if (!s.paused && sp.pauseOnArrival) {
        // paused while this start was on its way: keep it paused
        sp.pauseOnArrival = false
        window.spotifyPlayerInstance?.pause().catch(() => {})
        this.freezeSpotifyClock(true)
        this.wantPlay = false
        this.setStatus('paused')
      } else if (s.paused) {
        // (a start's first reports can be paused: keep waiting for sound)
        if (!(this.wantPlay && this.state.status === 'loading')) {
          this.wantPlay = false
          this.setStatus('paused')
        }
      } else {
        // playing, whoever started it (us, or the Spotify app)
        this.wantPlay = true
        this.setStatus('playing')
      }
      this.publishTime()
      return
    }

    // Spotify moved to another track by itself
    const q = this.state.queue
    const accept = (target: QueueItem) => {
      sp.live = true
      sp.position = s.position
      sp.duration = s.duration || track.duration_ms || 0
      sp.at = now
      sp.paused = s.paused
      this.apply({ type: 'sync', uid: target.uid })
      this.wantPlay = !s.paused
      this.setStatus(s.paused ? 'paused' : 'playing')
      this.publishTime()
    }
    const nextItem = q.items[q.index + 1]
    const prevItem = q.items[q.index - 1]

    if (q.repeat === 'one' && nearEnd) {
      // Spotify went on to the next in its list; we want this one again
      sp.live = false
      this.apply({ type: 'next', auto: true })
    } else if (nextItem && matchesSpotify(nextItem.track, track)) {
      accept(nextItem)
    } else if (prevItem && matchesSpotify(prevItem.track, track)) {
      accept(prevItem)
    } else if (nextItem || q.repeat !== 'off') {
      // the queue changed since Spotify got its list, or a beat is next:
      // play what the queue says
      sp.live = false
      this.wantPlay = true
      this.apply({ type: 'next' })
    } else {
      const known = q.items.find(i => matchesSpotify(i.track, track))
      if (known) accept(known)
      else if (nearEnd) {
        // Spotify's autoplay carrying on after the end of our queue
        window.spotifyPlayerInstance?.pause().catch(() => {})
        this.wantPlay = false
        this.freezeSpotifyClock(true)
        this.setStatus('paused')
      } else {
        // picked on another device (Spotify Connect): follow along
        this.adoptSpotify(s)
      }
    }
  }

  private adoptSpotify(s: SpotifyState) {
    const t = s.track_window.current_track
    const track = new SpotifyTrackModel({
      id: t.id,
      title: t.name,
      name: t.name,
      uri: t.uri,
      duration_ms: t.duration_ms,
      artists: t.artists as SpotifyTrack['artists'],
      album: t.album,
      source: 'spotify',
      audioUrl: '',
      mediaType: 'track'
    } as SpotifyTrack)
    this.state = {
      ...this.state,
      queue: queueReducer(this.state.queue, {
        type: 'play',
        tracks: [track],
        start: 0,
        context: null
      })
    }
    this.loadedUid = this.current?.uid ?? null
    Object.assign(this.sp, {
      live: true,
      paused: s.paused,
      position: s.position,
      duration: s.duration,
      at: performance.now(),
      expect: null
    })
    this.wantPlay = !s.paused
    this.engine?.stop()
    setBeatSource(null)
    this.syncMetadata()
    this.setStatus(s.paused ? 'paused' : 'playing')
    this.syncSpotifyPolling()
    this.emit()
  }

  /** The SDK only reports changes; a light poll keeps the clock honest. */
  private syncSpotifyPolling() {
    const want = this.currentIs('spotify')
    if (want && !this.pollTimer) {
      this.pollTimer = window.setInterval(() => {
        const item = this.current
        if (!item || !this.currentIs('spotify') || !isActive(this.state.status)) return
        if (
          this.state.status === 'loading' &&
          performance.now() - this.sp.loadingSince > SPOTIFY_START_TIMEOUT
        ) {
          this.sp.token++
          this.spotifyFailed(item)
          return
        }
        window.spotifyPlayerInstance
          ?.getCurrentState()
          .then(s => this.onSpotifyState(s as SpotifyState | null, true))
          .catch(() => {})
      }, SPOTIFY_POLL_MS)
    } else if (!want && this.pollTimer) {
      window.clearInterval(this.pollTimer)
      this.pollTimer = 0
    }
  }

  /* --- time ---------------------------------------------------------------------------- */

  private publishTime = () => {
    const item = this.current
    if (!item) {
      playerTime.set(0, 0)
      return
    }
    if (item.track.source === 'beat') {
      const e = this.engine
      if (!e || !e.ready || e.current?.id !== item.track.id) {
        playerTime.set(0, 0)
        return
      }
      playerTime.set(e.audio.currentTime, e.audio.duration)
      return
    }
    playerTime.set(
      this.spotifyPosition() / 1000,
      (this.sp.duration || item.track.duration_ms || 0) / 1000
    )
  }

  private tick = () => {
    this.raf = 0
    if (!isActive(this.state.status)) return
    this.publishTime()
    this.raf = requestAnimationFrame(this.tick)
  }

  private syncTicking() {
    if (isActive(this.state.status)) {
      if (!this.raf) this.raf = requestAnimationFrame(this.tick)
    } else {
      cancelAnimationFrame(this.raf)
      this.raf = 0
      this.publishTime()
    }
  }

  /* --- OS media controls ------------------------------------------------------------------ */

  private setupMediaSession() {
    if (!('mediaSession' in navigator)) return
    const set = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // not supported here
      }
    }
    set('play', () => this.setPlaying(true))
    set('pause', () => this.setPlaying(false))
    set('stop', () => this.setPlaying(false))
    set('nexttrack', () => this.next())
    set('previoustrack', () => this.prev())
    set('seekto', d => {
      if (d.seekTime !== undefined) this.seek(d.seekTime)
    })
    // left unset on purpose: with these, iOS shows ±10s instead of skip
    set('seekbackward', null)
    set('seekforward', null)
  }

  private syncMetadata() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const item = this.current
    // Spotify plays inside its own frame, which has its own controls
    if (!item || item.track.source !== 'beat') {
      navigator.mediaSession.metadata = null
      return
    }
    const beat = item.track as BeatTrack
    const art = beatCoverUrl(beat)
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: beat.title || 'Untitled beat',
        artist: beatSubtitle(beat) ?? beat.artist ?? 'GameOver',
        album: this.state.queue.context?.name ?? 'GameOver Studio',
        artwork: [
          art
            ? { src: art, sizes: '512x512', type: 'image/png' }
            : { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      })
    } catch {
      // MediaMetadata unsupported
    }
    this.syncMediaSessionState()
  }

  private syncMediaSessionState() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const beat = this.currentIs('beat')
    navigator.mediaSession.playbackState = !beat
      ? 'none'
      : isActive(this.state.status)
        ? 'playing'
        : 'paused'
    this.syncPositionState()
  }

  private syncPositionState() {
    if (!('mediaSession' in navigator) || !this.currentIs('beat')) return
    const a = this.engine?.audio
    if (!a || !Number.isFinite(a.duration) || a.duration <= 0) return
    try {
      navigator.mediaSession.setPositionState({
        duration: a.duration,
        playbackRate: 1,
        position: Math.max(0, Math.min(a.currentTime, a.duration))
      })
    } catch {
      // out-of-range values during a switch
    }
  }
}

const delay = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms))

/** Resolves once the Web Playback SDK has a device, or false after a wait. */
function waitForSpotify(timeout = 6000): Promise<boolean> {
  const ready = () => !!window.spotifyPlayerInstance?.deviceId
  if (ready()) return Promise.resolve(true)
  return new Promise(resolve => {
    const t0 = performance.now()
    const timer = window.setInterval(() => {
      if (ready()) {
        window.clearInterval(timer)
        resolve(true)
      } else if (performance.now() - t0 > timeout) {
        window.clearInterval(timer)
        resolve(false)
      }
    }, 200)
  })
}

declare global {
  var __gameoverPlayer: Player | undefined
}

// one player per page load (and kept across hot reloads in development)
export const player: Player = globalThis.__gameoverPlayer ?? new Player()
if (process.env.NODE_ENV !== 'production') globalThis.__gameoverPlayer = player

export type { Player }
