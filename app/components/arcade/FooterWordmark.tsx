'use client'

import { useRef } from 'react'
import { gameOver } from '@/lib/arcade'
import { BRAND_GRADIENT, Wordmark } from '../brand/Wordmark'

const TAPS = 3
/** each tap within this of the last one keeps the count going */
const CHAIN_MS = 650

/**
 * The giant GAMEOVER watermark at the bottom of every page. Point at it and
 * its letters light up as LEDs in the title's colours around the pointer;
 * tap it three times and it's game over.
 */
export function FooterWordmark() {
  const taps = useRef({ count: 0, at: 0 })
  const leds = useRef<HTMLSpanElement>(null)

  const onClick = (e: React.MouseEvent) => {
    const now = performance.now()
    const chain = taps.current
    chain.count = now - chain.at < CHAIN_MS ? chain.count + 1 : 1
    chain.at = now
    // a flash on every tap, so it feels like it's listening
    const el = leds.current
    if (el) {
      el.classList.remove('wordmark-hit')
      void el.offsetWidth
      el.classList.add('wordmark-hit')
    }
    if (chain.count >= TAPS) {
      chain.count = 0
      gameOver(e.clientX, e.clientY)
    }
  }

  return (
    <div aria-hidden className='mx-auto max-w-[1240px] overflow-hidden px-5 sm:px-8'>
      <div onClick={onClick} className='glow-card glow-flat glow-bare select-none'>
        <Wordmark tone='mono' label={null} className='block w-full text-white/[0.035]' />
        <span
          ref={leds}
          className='wordmark-leds absolute inset-0 opacity-(--lit) transition-opacity duration-500'
          style={{ backgroundImage: BRAND_GRADIENT }}
        />
      </div>
    </div>
  )
}
