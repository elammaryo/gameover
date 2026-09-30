'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { STAGE_REVEAL_EVENT, stageActive } from '@/lib/stage'

const noop = () => () => {}

/**
 * A number that rolls up from zero like an arcade score, once, when the page
 * appears (after the stage transition, if one is covering the page). The
 * server renders the real value, so it's right without JavaScript, and a
 * later change (fresh data) simply shows the new number.
 */
export function CountUp({
  value,
  duration = 1100,
  pad = 0
}: {
  value: number
  duration?: number
  /** zero-pad to this many digits, e.g. 3 → 042 */
  pad?: number
}) {
  // 0 → 1 while rolling, null once settled
  const [roll, setRoll] = useState<number | null>(null)
  // true when this render is hydrating server HTML (the number is already on
  // screen), false when mounted on the client (e.g. arriving from home)
  const hydrating = useSyncExternalStore(noop, () => false, () => true)
  const [fromServer] = useState(hydrating)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // slow hydration: the real number has been showing for a while, so
    // rolling back to zero would look like a glitch
    if (fromServer && performance.now() > 1800) return
    let raf = 0
    const run = () => {
      const t0 = performance.now()
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / duration)
        setRoll(k < 1 ? k : null)
        if (k < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    if (stageActive()) window.addEventListener(STAGE_REVEAL_EVENT, run, { once: true })
    else run()
    return () => {
      window.removeEventListener(STAGE_REVEAL_EVENT, run)
      cancelAnimationFrame(raf)
    }
  }, [duration, fromServer])

  const shown = roll === null ? value : Math.round(value * (1 - Math.pow(1 - roll, 3)))
  return <>{pad ? String(shown).padStart(pad, '0') : shown}</>
}
