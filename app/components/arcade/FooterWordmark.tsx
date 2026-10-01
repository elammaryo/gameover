'use client'

import { useEffect, useRef, useState } from 'react'
import { gameOver } from '@/lib/arcade'
import { cn } from '@/lib/utils'
import { BRAND_GRADIENT, Wordmark } from '../brand/Wordmark'

const TAPS = 3
/** a tap within this of the last one keeps the charge building */
const CHAIN_MS = 1200
/** how much of GAMEOVER each charge lights: GAM, GAMEO, all of it */
const LIT = ['0%', '37%', '66%', '100%']

/**
 * The giant GAMEOVER watermark at the bottom of every page. Point at it and
 * its letters light up as LEDs in the title's colours around the pointer.
 * Tap it and it charges up, a few letters at a time (GAM, GAMEO, GAMEOVER):
 * fill it and it's game over. Taps here are its own, not the rhythm
 * game's.
 */
export function FooterWordmark() {
  const [charge, setCharge] = useState(0)
  const last = useRef(0)
  const leds = useRef<HTMLSpanElement>(null)

  // let go and the charge drains away
  useEffect(() => {
    if (!charge) return
    const t = window.setTimeout(() => setCharge(0), charge >= TAPS ? 700 : CHAIN_MS)
    return () => window.clearTimeout(t)
  }, [charge])

  const onClick = (e: React.MouseEvent) => {
    const now = performance.now()
    const next = now - last.current < CHAIN_MS && charge < TAPS ? charge + 1 : 1
    last.current = now
    setCharge(next)
    // a flash on every tap, so it feels like it's listening
    const el = leds.current
    if (el) {
      el.classList.remove('wordmark-hit')
      void el.offsetWidth
      el.classList.add('wordmark-hit')
    }
    if (next >= TAPS) gameOver(e.clientX, e.clientY)
  }

  return (
    <div aria-hidden className='mx-auto max-w-[1240px] overflow-hidden px-5 sm:px-8'>
      <div
        onClick={onClick}
        data-no-rhythm
        className='glow-card glow-flat glow-bare select-none'
      >
        <Wordmark tone='mono' label={null} className='block w-full text-white/[0.035]' />
        {/* lit around the pointer */}
        <span
          ref={leds}
          className='wordmark-leds absolute inset-0 opacity-(--lit) transition-opacity duration-500'
          style={{ backgroundImage: BRAND_GRADIENT }}
        />
        {/* the charge, filling from the left (glowing: the filter sits
            outside the mask, or the mask would cut the glow off) */}
        <span
          className={cn(
            'pointer-events-none absolute inset-0',
            charge > 0 && 'drop-shadow-[0_0_10px_rgb(90_112_223/0.7)]'
          )}
        >
          <span
            className='wordmark-leds-full absolute inset-0 transition-[clip-path,opacity] duration-300 ease-snap'
            style={{
              backgroundImage: BRAND_GRADIENT,
              clipPath: `inset(0 calc(100% - ${LIT[charge]}) 0 0)`,
              opacity: charge ? 1 : 0
            }}
          />
        </span>
      </div>
    </div>
  )
}
