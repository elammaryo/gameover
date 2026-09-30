'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { Track } from '@/app/models/Track'
import { useSpotifyPlayer } from '../components/useSpotifyPlayer'
import { EMPTY_QUEUE, currentItem, upcoming, type QueueItem } from '@/lib/queue'
import {
  isActive,
  player,
  type PlayerState,
  type PlayerStatus,
  type PlayerVolume
} from './player'

export type { PlayContext } from './player'

const SERVER_STATE: PlayerState = { queue: EMPTY_QUEUE, status: 'idle', offline: false }
const SERVER_VOLUME: PlayerVolume = { level: 0.8, muted: false }
const noSubscribe = () => () => {}

function readSpotifyLoggedIn() {
  return !!document.cookie
    .split(';')
    .find(c => c.trim().startsWith('spotify_logged_in='))
    ?.split('=')[1]
}

/**
 * Starts the player on the client and connects the Spotify Web Playback SDK
 * for visitors who connected Spotify. The player itself lives in
 * ./player.ts; components read it with the hooks below.
 */
export default function PlayBarProvider({
  children
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    player.init()
  }, [])

  const spotifyLoggedIn = useSyncExternalStore(
    noSubscribe,
    readSpotifyLoggedIn,
    () => false
  )
  useSpotifyPlayer({
    isLoggedIn: spotifyLoggedIn,
    onState: player.onSpotifyState
  })

  return children
}

const actions = {
  play: player.play,
  prime: player.prime,
  toggle: player.toggle,
  setPlayPause: player.setPlaying,
  onNext: player.next,
  onPrev: player.prev,
  seek: player.seek,
  jumpTo: player.jump,
  playNext: player.playNext,
  addToQueue: player.addToQueue,
  remove: player.remove,
  reorder: player.reorder,
  clearQueue: player.clearQueue,
  toggleShuffle: player.toggleShuffle,
  cycleRepeat: player.cycleRepeat,
  stop: player.stop
}

export type PlayerView = typeof actions & {
  status: PlayerStatus
  /** playing, or about to (loading) */
  isPlaying: boolean
  isLoading: boolean
  /** lost the connection; it retries on its own */
  offline: boolean
  current: QueueItem | null
  selectedTrack: Track | null
  items: QueueItem[]
  index: number
  upNext: QueueItem[]
  contextId: string | null
  contextName: string | null
  shuffle: boolean
  repeat: PlayerState['queue']['repeat']
  /** which way the last track change went: 1 next, -1 previous, 0 jump */
  direction: 1 | -1 | 0
  canNext: boolean
  canPrev: boolean
}

function view(state: PlayerState): PlayerView {
  const q = state.queue
  const current = currentItem(q)
  return {
    ...actions,
    status: state.status,
    isPlaying: isActive(state.status),
    isLoading: state.status === 'loading',
    offline: state.offline,
    current,
    selectedTrack: current?.track ?? null,
    items: q.items,
    index: q.index,
    upNext: upcoming(q),
    contextId: q.context?.id ?? null,
    contextName: q.context?.name ?? null,
    shuffle: q.shuffle,
    repeat: q.repeat,
    direction: q.direction,
    canNext: !!current && (q.index + 1 < q.items.length || q.repeat !== 'off'),
    canPrev: !!current
  }
}

/** Everything about playback: state and actions. */
export function usePlayer(): PlayerView {
  const state = useSyncExternalStore(
    player.subscribe,
    player.getState,
    () => SERVER_STATE
  )
  return useMemo(() => view(state), [state])
}

/**
 * One value from the player. `select` must return something comparable
 * with === (a string, number, boolean or a stored object), and the
 * component re-renders only when that value changes: long lists use this
 * so queue edits don't re-render every row.
 */
export function usePlayerSelect<T>(select: (state: PlayerState) => T, server: T): T {
  return useSyncExternalStore(
    player.subscribe,
    () => select(player.getState()),
    () => server
  )
}

/** Just "is something playing" (re-renders only when that flips). */
export function useIsPlaying(): boolean {
  return usePlayerSelect(s => isActive(s.status), false)
}

/** What a track row needs: which track is current, and whether it plays. */
export function useNowPlaying() {
  const trackId = usePlayerSelect(s => currentItem(s.queue)?.track.id ?? null, null)
  const status = usePlayerSelect(s => s.status, 'idle' as PlayerStatus)
  const contextId = usePlayerSelect(s => s.queue.context?.id ?? null, null)
  return {
    trackId,
    contextId,
    isPlaying: isActive(status),
    isLoading: status === 'loading'
  }
}

/** The player's actions (stable; reading them never re-renders). */
export const playerActions = actions

export function usePlayerVolume() {
  const volume = useSyncExternalStore(
    player.subscribeVolume,
    player.getVolume,
    () => SERVER_VOLUME
  )
  return {
    ...volume,
    /** 0–1, what you actually hear */
    effective: volume.muted ? 0 : volume.level,
    setVolume: player.setVolume,
    toggleMute: player.toggleMute
  }
}
