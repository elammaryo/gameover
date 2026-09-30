'use client'

import type { BeatTrack } from '../models/Track'
import {
  playerActions as p,
  useNowPlaying,
  type PlayContext
} from '../providers/PlayBarProvider'

/**
 * One place for "press play on a beat": the same beat toggles pause/resume;
 * a different beat starts playing, and the list it came from (`context`)
 * becomes what plays next. Re-renders only when the playing track or the
 * play state changes (not on queue edits).
 */
export function useBeatPlayback() {
  const now = useNowPlaying()
  const currentId = now.trackId

  const stateOf = (id: string) => {
    const current = currentId === id
    return { current, playing: current && now.isPlaying, loading: current && now.isLoading }
  }

  const toggle = (beat: BeatTrack, list: BeatTrack[], context: PlayContext | null = null) => {
    if (currentId === beat.id) {
      p.toggle()
      return
    }
    const at = list.findIndex(b => b.id === beat.id)
    if (at < 0) p.play([beat, ...list], 0, context)
    else p.play(list, at, context)
  }

  /** Is this list what's playing? (By its context when it has one.) */
  const onList = (beats: BeatTrack[], context?: PlayContext | null) =>
    (!context || now.contextId === context.id) && beats.some(b => b.id === currentId)

  /** Play a whole list from the top (or shuffled). Toggles if already on it. */
  const playAll = (
    beats: BeatTrack[],
    opts: { shuffle?: boolean; context?: PlayContext | null } = {}
  ) => {
    if (!beats.length) return
    const context = opts.context ?? null
    if (onList(beats, context) && !opts.shuffle) {
      p.toggle()
      return
    }
    if (opts.shuffle) {
      p.play(beats, Math.floor(Math.random() * beats.length), context, { shuffle: true })
    } else {
      p.play(beats, 0, context)
    }
  }

  const listState = (beats: BeatTrack[], context?: PlayContext | null) => {
    const current = onList(beats, context)
    return { current, playing: current && now.isPlaying }
  }

  return { toggle, playAll, stateOf, listState, isPlaying: now.isPlaying }
}
