'use client'

import { useSyncExternalStore } from 'react'

/* ---------------------------------------------------------------------------
   Playback position, kept outside React state: the player writes it up to
   ~30 times a second and only the few components that show time (seek bars,
   the progress line) re-render, not the whole page.
--------------------------------------------------------------------------- */

export type PlayerTime = { current: number; duration: number }

const ZERO: PlayerTime = { current: 0, duration: 0 }
let snapshot: PlayerTime = ZERO
const listeners = new Set<() => void>()

export const playerTime = {
  get: () => snapshot,
  set(current: number, duration: number) {
    const d = Number.isFinite(duration) && duration > 0 ? duration : 0
    const c = Math.max(0, d ? Math.min(current, d) : current)
    if (Math.abs(c - snapshot.current) < 0.03 && d === snapshot.duration) return
    snapshot = { current: c, duration: d }
    listeners.forEach(fn => fn())
  },
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }
}

export function usePlayerTime(): PlayerTime {
  return useSyncExternalStore(playerTime.subscribe, playerTime.get, () => ZERO)
}
