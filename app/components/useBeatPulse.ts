'use client'

import { useContext, useEffect } from 'react'
import { PlayBarContext } from '../providers/PlayBarProvider'
import { readBeat } from '@/lib/beatClock'

/* ---------------------------------------------------------------------------
   While a beat plays, every registered element gets the beat as CSS custom
   properties, updated each frame by one shared loop:

     --kick  1 on each beat, decaying (the kick drum)
     --hat   1 on each 16th, decaying fast (the hi-hats)
     --bar   0 → 1 through the current bar of four beats (a playhead)

   plus `data-beat="on"`, so CSS can swap an idle animation for the synced
   one. Written per element on purpose: a per-frame change on :root would
   restyle the whole page.
--------------------------------------------------------------------------- */

const registered = new Set<HTMLElement>()
let raf = 0

function reset(el: HTMLElement) {
  el.style.setProperty('--kick', '0')
  el.style.setProperty('--hat', '0')
  el.style.setProperty('--bar', '0')
  delete el.dataset.beat
}

function tick() {
  raf = 0
  if (!registered.size) return
  const beat = readBeat()
  const kick = beat.kick.toFixed(3)
  const hat = beat.hat.toFixed(3)
  const bar = ((beat.beats % 4) / 4).toFixed(4)
  for (const el of registered) {
    if (beat.playing) {
      el.style.setProperty('--kick', kick)
      el.style.setProperty('--hat', hat)
      el.style.setProperty('--bar', bar)
      if (el.dataset.beat !== 'on') el.dataset.beat = 'on'
    } else if (el.dataset.beat) {
      reset(el) // buffering / seeking: settle until the clock runs again
    }
  }
  raf = requestAnimationFrame(tick)
}

export function useBeatPulse(ref: React.RefObject<HTMLElement | null>) {
  const { isPlaying } = useContext(PlayBarContext)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!isPlaying || reduce) {
      reset(el)
      return
    }
    registered.add(el)
    if (!raf) raf = requestAnimationFrame(tick)
    return () => {
      registered.delete(el)
      reset(el)
    }
  }, [isPlaying, ref])
}
