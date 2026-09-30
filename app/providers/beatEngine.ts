import { getBeatSignedUrl } from '../api'
import type { BeatTrack } from '../models/Track'

/* ---------------------------------------------------------------------------
   Beat playback: one <audio> element for the whole visit, driven directly.

   Why it's built like this (each of these used to stall the player):
   - Every load gets a token, so a skip that lands while the previous track
     is still loading simply supersedes it; nothing waits on an event that
     may never come, and nothing from an old load touches the new one.
   - play() is called straight away instead of waiting for `canplay` (iOS
     doesn't fire it until playback is requested).
   - S3 links expire after an hour. Links are reused for 40 minutes at most,
     and when the audio errors or stalls (an expired link mid-track, a
     dropped connection) the engine fetches a fresh link and carries on
     from the same second, twice before giving up on that track.
   - Link requests time out, so a request that hangs can't hold the player.
   - Failures say why: 'network' (the connection) or 'broken' (the beat).
     The player waits out the first and skips the second.
   - The element is unlocked inside the first tap, so later auto-advances
     are allowed to play on iOS.
   - A pause the system makes (a phone call, headphones unplugged) is
     reported as a pause, so the UI and lock screen stay truthful.

   Skips fade the outgoing track out and the new one in (a few hundred ms)
   where scripts can set the volume and the tab is visible; otherwise the
   old track just stops.
--------------------------------------------------------------------------- */

export type EngineStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'
export type FailReason = 'network' | 'broken'

type Events = {
  onStatus: (status: EngineStatus) => void
  /** the track played to its end */
  onEnded: () => void
  /** a track couldn't be played; `at` is where it had got to (seconds) */
  onFailed: (track: BeatTrack, reason: FailReason, at: number) => void
  /** position / duration changed outside of normal playback (seek, load) */
  onTime: () => void
}

const LINK_TTL = 40 * 60 * 1000 // S3 links last 60 minutes
const LINK_TIMEOUT = 10_000
const MAX_RETRIES = 2
const STALL_MS = 9000
const FADE_OUT_MS = 150
const FADE_IN_MS = 280

function silentWavUrl() {
  const n = 400
  const rate = 8000
  const buf = new ArrayBuffer(44 + n)
  const v = new DataView(buf)
  const put = (at: number, s: string) =>
    [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)))
  put(0, 'RIFF')
  v.setUint32(4, 36 + n, true)
  put(8, 'WAVE')
  put(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, rate, true)
  v.setUint32(28, rate, true)
  v.setUint16(32, 1, true)
  v.setUint16(34, 8, true)
  put(36, 'data')
  v.setUint32(40, n, true)
  new Uint8Array(buf, 44).fill(128)
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
}

/** The connection (retry later) or the beat itself (skip it)? */
function reasonOf(err: unknown): FailReason {
  const name = (err as { name?: string } | null)?.name
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'network'
  // fetch() rejects with a TypeError when the request never got an answer
  if (err instanceof TypeError || name === 'AbortError' || name === 'TimeoutError') {
    return 'network'
  }
  return 'broken'
}

export class BeatEngine {
  readonly audio: HTMLAudioElement
  private readonly on: Events
  private links = new Map<string, { url: string; at: number }>()
  private pending = new Map<string, Promise<string>>()
  private token = 0
  private track: BeatTrack | null = null
  /** the track whose audio the element actually holds */
  private loadedId: string | null = null
  private status: EngineStatus = 'idle'
  private retries = 0
  private wantPlay = false
  private level = 1
  private readonly canFade: boolean
  private stallTimer = 0
  private unlocked = false
  private switching = false
  private recovering = false
  /** failed: the element's own events mustn't change the status */
  private errored = false
  private disposed = false
  /** where to put the playhead once this load's audio is in */
  private resume: { token: number; at: number } | null = null
  /** what went wrong last on this track: the connection, or the file */
  private trouble: FailReason = 'broken'
  /** where the last failure left off (a later play() resumes there) */
  private failedAt = 0
  /** when we last put a new source on the element ourselves */
  private swapAt = 0
  // fades
  private fadeRaf = 0
  private fadeTimer = 0
  private fadeDone: (() => void) | null = null
  /** where the fade in progress is heading; 'level' follows volume changes */
  private fadeTarget: number | 'level' = 'level'

  constructor(events: Events) {
    this.on = events
    const a = new Audio()
    a.preload = 'auto'
    // in the document (hidden) so it shows up in dev tools and tests
    a.setAttribute('data-player-audio', '')
    a.hidden = true
    document.body.appendChild(a)
    this.audio = a

    // scripts can't set the volume on iOS; skip the fades there
    const probe = new Audio()
    probe.volume = 0.5
    this.canFade = Math.abs(probe.volume - 0.5) < 0.01

    a.addEventListener('playing', this.handlePlaying)
    a.addEventListener('pause', this.handlePause)
    a.addEventListener('waiting', this.handleWaiting)
    a.addEventListener('stalled', this.handleStalled)
    a.addEventListener('progress', this.handleProgress)
    a.addEventListener('timeupdate', this.handleTimeUpdate)
    a.addEventListener('ended', this.handleEnded)
    a.addEventListener('error', this.handleError)
    a.addEventListener('loadedmetadata', this.handleMetadata)
    a.addEventListener('durationchange', this.handleTime)
    a.addEventListener('seeked', this.handleTime)
    // animation frames stop in background tabs: finish any fade at once
    document.addEventListener('visibilitychange', this.handleVisibility)
  }

  /* --- public ------------------------------------------------------------ */

  get current() {
    return this.track
  }

  /** The element holds the current track's audio (not a previous one's). */
  get ready() {
    return !!this.track && !this.switching && this.loadedId === this.track.id
  }

  /** Seconds into the current track (0 while it loads). */
  get position() {
    return this.ready ? this.audio.currentTime || 0 : 0
  }

  /** Call synchronously inside a tap/click, before anything async. */
  unlock() {
    if (this.unlocked) return
    this.unlocked = true
    if (this.audio.src) return
    this.audio.src = silentWavUrl()
    this.audio.play().then(
      () => {
        if (this.track === null) this.audio.pause()
      },
      () => {}
    )
  }

  /** Load `track`; with `at`, start from that second. */
  async load(track: BeatTrack, opts: { autoplay: boolean; at?: number }) {
    const token = ++this.token
    const playingBefore = !this.audio.paused
    this.track = track
    this.retries = 0
    this.wantPlay = opts.autoplay
    this.switching = true
    this.recovering = false
    this.errored = false
    this.resume = null
    this.trouble = 'broken'
    this.clearStall()
    this.emit(opts.autoplay ? 'loading' : 'paused')

    // where the volume can't be faded, the old track stops right away
    let fadeOut: Promise<void> = Promise.resolve()
    if (playingBefore) {
      if (this.canFade && document.visibilityState === 'visible') {
        fadeOut = this.fadeTo(0, FADE_OUT_MS)
      } else {
        this.audio.pause()
      }
    }

    let url: string
    try {
      url = await this.linkFor(track)
    } catch (err) {
      if (token !== this.token) return
      // don't leave the previous track running (silently) underneath
      await fadeOut
      if (token !== this.token) return
      this.switching = false
      this.errored = true // (so the pause below doesn't read as the listener's)
      this.audio.pause()
      this.setVolumeNow(this.level)
      this.on.onTime()
      this.fail(reasonOf(err), opts.at ?? 0)
      return
    }
    await fadeOut
    if (token !== this.token || this.disposed) return

    this.audio.pause()
    this.swapAt = performance.now()
    this.audio.src = url
    this.loadedId = track.id
    this.switching = false
    if (opts.at && opts.at > 0) this.resume = { token, at: opts.at }
    this.on.onTime()
    // wantPlay, not opts.autoplay: pausing while it loaded should stick
    if (this.wantPlay) this.start(token, true)
    else {
      this.setVolumeNow(this.level)
      this.emit('paused')
    }
  }

  /** Same track again from the top (repeat one, "previous" after 3s). */
  restart() {
    if (!this.track) return
    if (!this.ready) {
      this.play() // (re)loads it, or starts it once its link is in
      return
    }
    this.resume = null
    this.audio.currentTime = 0
    this.on.onTime()
    this.play()
  }

  play() {
    this.wantPlay = true
    if (!this.track) return
    if (this.switching) {
      // still fetching this track's link: it starts as soon as it's in
      this.emit('loading')
      return
    }
    if (!this.ready || this.errored) {
      // after a failure, carry on from where it stopped
      this.load(this.track, { autoplay: true, at: this.errored ? this.failedAt : 0 })
      return
    }
    if (this.audio.ended) this.audio.currentTime = 0
    if (!this.audio.paused) {
      // resumed during the pause fade: bring the level back up
      this.fadeTo('level', 120)
      this.emit('playing')
      return
    }
    this.emit('loading')
    this.start(this.token, true)
  }

  pause() {
    this.wantPlay = false
    this.clearStall()
    // mid-switch the old track is already on its way out, and the new one
    // won't start now
    if (this.audio.paused || this.switching) {
      this.emit('paused')
      return
    }
    const token = this.token
    // a short fade so pausing doesn't click
    this.fadeTo(0, 110).then(() => {
      if (token === this.token && !this.wantPlay) this.audio.pause()
    })
    this.emit('paused')
  }

  stop() {
    this.token++
    this.wantPlay = false
    this.track = null
    this.loadedId = null
    this.switching = false
    this.recovering = false
    this.errored = false
    this.resume = null
    this.clearStall()
    this.settleFade()
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
    this.emit('idle')
    this.on.onTime()
  }

  seek(seconds: number) {
    if (!this.ready) return
    this.resume = null
    const d = this.audio.duration
    this.audio.currentTime = Math.max(0, Number.isFinite(d) ? Math.min(seconds, d - 0.05) : seconds)
    this.on.onTime()
  }

  setVolume(level: number) {
    this.level = Math.max(0, Math.min(1, level))
    if (!this.fadeDone) this.setVolumeNow(this.level)
  }

  /** Fetch the link for a track that's coming up, so skipping is instant. */
  prefetch(track: BeatTrack) {
    this.linkFor(track).catch(() => {})
  }

  dispose() {
    this.disposed = true
    this.stop()
    document.removeEventListener('visibilitychange', this.handleVisibility)
    this.audio.remove()
  }

  /* --- internals ----------------------------------------------------------- */

  private emit(status: EngineStatus) {
    this.status = status
    this.on.onStatus(status)
  }

  private linkFor(track: BeatTrack, fresh = false): Promise<string> {
    const hit = this.links.get(track.id)
    if (!fresh && hit && Date.now() - hit.at < LINK_TTL) return Promise.resolve(hit.url)
    const inFlight = this.pending.get(track.id)
    if (!fresh && inFlight) return inFlight
    const abort = new AbortController()
    const timer = window.setTimeout(() => abort.abort(), LINK_TIMEOUT)
    const request = getBeatSignedUrl(track.id, abort.signal)
      .then(url => {
        if (!url) throw new Error('No audio link')
        this.links.set(track.id, { url, at: Date.now() })
        return url
      })
      .finally(() => {
        window.clearTimeout(timer)
        if (this.pending.get(track.id) === request) this.pending.delete(track.id)
      })
    this.pending.set(track.id, request)
    return request
  }

  private start(token: number, fadeIn: boolean) {
    if (fadeIn && this.canFade) this.setVolumeNow(0)
    const attempt = this.audio.play()
    if (!attempt) return
    attempt.then(
      () => {
        if (token !== this.token) return
        if (fadeIn) this.fadeTo('level', FADE_IN_MS)
        else this.setVolumeNow(this.level)
      },
      (err: DOMException) => {
        if (token !== this.token) return
        this.setVolumeNow(this.level)
        // superseded by a newer load, or paused while starting: fine
        if (err?.name === 'AbortError') return
        if (err?.name === 'NotAllowedError') {
          // the browser wants a tap first
          this.wantPlay = false
          this.emit('paused')
          return
        }
        if (!navigator.onLine) this.trouble = 'network'
        this.recover()
      }
    )
  }

  /** A fresh link, then carry on from the same second. */
  private async recover() {
    const track = this.track
    // one recovery at a time (a failed play() and the error event both land here)
    if (!track || this.switching || this.recovering || this.errored) return
    const token = this.token
    const pending = this.resume?.token === token ? this.resume.at : 0
    const at = Math.max(pending, this.audio.currentTime || 0)
    if (this.retries >= MAX_RETRIES) {
      // fresh links didn't help: the file, unless it was the connection
      // all along (then the player waits for it instead of skipping)
      const network = this.trouble === 'network' || navigator.onLine === false
      this.fail(network ? 'network' : 'broken', at)
      return
    }
    this.retries++
    this.recovering = true
    this.clearStall()
    // a link that lapsed while paused is fixed quietly, without a spinner
    if (this.wantPlay) this.emit('loading')
    let url: string
    try {
      url = await this.linkFor(track, true)
    } catch (err) {
      if (token !== this.token) return
      this.recovering = false
      this.fail(reasonOf(err), at)
      return
    }
    if (token !== this.token || this.disposed) return
    this.recovering = false
    this.resume = at > 0 ? { token, at } : null
    this.swapAt = performance.now()
    this.audio.src = url
    this.loadedId = track.id
    if (this.wantPlay) this.start(token, false)
    else this.emit('paused')
  }

  private fail(reason: FailReason, at: number) {
    const track = this.track
    this.clearStall()
    this.wantPlay = false
    this.errored = true
    this.failedAt = at
    this.emit('error')
    if (track) this.on.onFailed(track, reason, at)
  }

  private levelOf(target: number | 'level') {
    return target === 'level' ? this.level : target
  }

  private fadeTo(target: number | 'level', ms: number): Promise<void> {
    this.settleFade(false)
    // no fades where the volume is fixed (iOS) or frames don't run (hidden tab)
    if (!this.canFade || ms <= 0 || document.visibilityState === 'hidden') {
      this.setVolumeNow(this.levelOf(target))
      return Promise.resolve()
    }
    const from = this.audio.volume
    const t0 = performance.now()
    this.fadeTarget = target
    return new Promise(resolve => {
      this.fadeDone = resolve
      // frames can stop without the tab being hidden (an occluded window):
      // the fade finishes on time regardless
      this.fadeTimer = window.setTimeout(() => this.settleFade(), ms + 250)
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / ms)
        this.setVolumeNow(from + (this.levelOf(target) - from) * k * (2 - k))
        if (k < 1) this.fadeRaf = requestAnimationFrame(step)
        else this.settleFade()
      }
      this.fadeRaf = requestAnimationFrame(step)
    })
  }

  /**
   * Ends the fade in progress and releases whatever awaits it. `jump` also
   * sets its target level (a fade we abandon for another one doesn't).
   */
  private settleFade(jump = true) {
    cancelAnimationFrame(this.fadeRaf)
    window.clearTimeout(this.fadeTimer)
    this.fadeRaf = 0
    this.fadeTimer = 0
    const done = this.fadeDone
    this.fadeDone = null
    if (done) {
      if (jump) this.setVolumeNow(this.levelOf(this.fadeTarget))
      done()
    }
  }

  private setVolumeNow(v: number) {
    try {
      this.audio.volume = Math.max(0, Math.min(1, v))
    } catch {
      // read-only on some platforms
    }
  }

  private armStall() {
    this.clearStall()
    this.stallTimer = window.setTimeout(() => {
      // still starved of data while we want sound: the link or the
      // connection is gone, so get a new link
      if (this.wantPlay && this.audio.readyState < 3) {
        this.trouble = 'network'
        this.recover()
      }
    }, STALL_MS)
  }

  private clearStall() {
    window.clearTimeout(this.stallTimer)
    this.stallTimer = 0
  }

  /* --- element events ------------------------------------------------------ */

  private handlePlaying = () => {
    this.clearStall()
    if (!this.track || this.switching) return
    this.errored = false
    this.emit('playing')
    // a track that has played for a while has earned its retries back
    const token = this.token
    window.setTimeout(() => {
      if (token === this.token && !this.audio.paused) this.retries = 0
    }, 15000)
  }

  private handlePause = () => {
    if (this.switching || !this.track || this.errored || this.audio.ended) return
    // playback stopping because the source failed isn't a pause: the error
    // handler is already getting a fresh link
    if (this.recovering || this.audio.error) return
    if (this.wantPlay) {
      // a pause we didn't ask for is the system's (a call, headphones out,
      // another app taking the audio). Browsers that report a pause for a
      // source we just swapped in get a moment's grace
      if (performance.now() - this.swapAt < 800) return
      this.wantPlay = false
      this.clearStall()
    }
    this.emit('paused')
  }

  private handleWaiting = () => {
    if (!this.track || !this.wantPlay || this.switching || this.errored) return
    this.emit('loading')
    this.armStall()
  }

  private handleStalled = () => {
    // the download has stalled, but plenty may be buffered: just watch it
    if (!this.track || !this.wantPlay || this.switching || this.errored) return
    this.armStall()
  }

  private handleProgress = () => {
    // data is arriving: give the stall watchdog more time
    if (this.stallTimer) this.armStall()
  }

  private handleTimeUpdate = () => {
    // playing again after a hiccup that didn't announce itself
    if (
      this.status === 'loading' &&
      !this.switching &&
      !this.audio.paused &&
      this.audio.readyState >= 3
    ) {
      this.clearStall()
      this.emit('playing')
    }
  }

  private handleEnded = () => {
    // while switching, the element still holds the previous source (or the
    // silent unlock clip): its end isn't the new track's
    if (!this.track || this.switching || this.errored) return
    this.clearStall()
    this.on.onEnded()
  }

  private handleError = () => {
    if (!this.track || this.switching || this.errored) return
    const error = this.audio.error
    // MEDIA_ERR_ABORTED: we changed the source ourselves
    if (error?.code === 1) return
    // MEDIA_ERR_NETWORK, or a network failure reported as a format error
    const network =
      error?.code === 2 || /network|net::/i.test(error?.message ?? '') || !navigator.onLine
    // sticky for this load: once the connection has failed, later errors
    // that some browsers report as "format" errors don't clear it
    if (network) this.trouble = 'network'
    this.recover()
  }

  private handleMetadata = () => {
    // put the playhead back where a recovery (or a retry) left off, but
    // only for the load that asked for it
    const r = this.resume
    if (r && r.token === this.token && this.ready) {
      this.resume = null
      try {
        this.audio.currentTime = r.at
      } catch {
        // not seekable yet; it plays from the top instead
      }
    }
    this.on.onTime()
  }

  private handleTime = () => this.on.onTime()

  private handleVisibility = () => {
    if (document.visibilityState === 'hidden') this.settleFade()
  }
}
