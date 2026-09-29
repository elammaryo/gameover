'use client'

import { useContext } from 'react'
import { PlayBarContext } from '../providers/PlayBarProvider'
import type { BeatTrack } from '../models/Track'
import { shuffled } from '@/lib/beats'

/**
 * One place for "press play on a beat": the same beat toggles pause/resume,
 * a different beat starts playing and the list it came from becomes the
 * queue.
 */
export function useBeatPlayback() {
  const { selectedTrack, isPlaying, setTrack, setQueue, setPlayPause } =
    useContext(PlayBarContext)

  const stateOf = (id: string) => {
    const current = selectedTrack?.id === id
    return { current, playing: current && isPlaying }
  }

  const toggle = async (beat: BeatTrack, queue: BeatTrack[]) => {
    if (selectedTrack?.id === beat.id) {
      setPlayPause(!isPlaying)
      return
    }
    await setTrack(beat)
    setQueue(beat, queue)
  }

  /** Play a whole list from the top (or shuffled). Toggles if already on it. */
  const playAll = async (beats: BeatTrack[], opts: { shuffle?: boolean } = {}) => {
    if (!beats.length) return
    const onThisList = beats.some(b => b.id === selectedTrack?.id)
    if (onThisList && !opts.shuffle) {
      setPlayPause(!isPlaying)
      return
    }
    const queue = opts.shuffle ? shuffled(beats) : beats
    await setTrack(queue[0])
    setQueue(queue[0], queue)
  }

  const listState = (beats: BeatTrack[]) => {
    const current = beats.some(b => b.id === selectedTrack?.id)
    return { current, playing: current && isPlaying }
  }

  return { toggle, playAll, stateOf, listState, selectedTrack, isPlaying }
}
