'use client'

import { useEffect, useState } from 'react'
import { readSfx, sfx } from '@/lib/sfx'
import { HIT_EVENT, LOGO_GLITCH_EVENT } from '@/lib/stage'
import { unlock } from '@/lib/trophies'

// ↑ ↑ ↓ ↓ ← → ← → B A
const CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a'
]
const PARTY_MS = 8000

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

/** a swipe: this far (px) along one axis, quickly */
const SWIPE = 40
const SWIPE_MS = 1500
const TAP_MOVE = 12

/**
 * An easter egg for the ones who try it: the Konami code turns the LED wall
 * into a light show for a few seconds. Nothing else changes. On a touch
 * screen it's swiped: up, up, down, down, left, right, left, right, then
 * two taps for B and A.
 */
export function CheatCodes() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    let at = 0
    let timers: number[] = []

    /** one step of the code; true when it's complete */
    const step = (key: string) => {
      // (a tap stands for B, then A)
      const want = CODE[at]
      const matches = key === want || (key === 'tap' && (want === 'b' || want === 'a'))
      at = matches ? at + 1 : key === CODE[0] ? 1 : 0
      if (at < CODE.length) return false
      at = 0
      return true
    }

    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (step(key)) accept()
    }

    // swipes: touch events, which keep coming while the page scrolls
    // (pointer events stop as soon as a swipe becomes a scroll)
    let start: { x: number; y: number; t: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        start = null
        return
      }
      const t = e.touches[0]
      start = { x: t.clientX, y: t.clientY, t: performance.now() }
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      const from = start
      start = null
      if (!from || !t || typing(e.target)) return
      const dx = t.clientX - from.x
      const dy = t.clientY - from.y
      const quick = performance.now() - from.t < SWIPE_MS
      let key: string | null = null
      if (Math.max(Math.abs(dx), Math.abs(dy)) < TAP_MOVE) key = 'tap'
      else if (quick && Math.abs(dy) > SWIPE && Math.abs(dy) > Math.abs(dx) * 1.5)
        key = dy < 0 ? 'ArrowUp' : 'ArrowDown'
      else if (quick && Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5)
        key = dx < 0 ? 'ArrowLeft' : 'ArrowRight'
      if (key && step(key)) accept()
    }

    const accept = () => {
      timers.forEach(clearTimeout)
      timers = []
      setActive(true)
      unlock('cheat-code')
      document.documentElement.dataset.cheat = ''
      window.dispatchEvent(new Event(LOGO_GLITCH_EVENT))
      if (readSfx()) sfx()?.start(0)
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!reduce) {
        for (let i = 0; i < 14; i++) {
          timers.push(
            window.setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent(HIT_EVENT, {
                  detail: {
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight * 0.6,
                    power: 1.3
                  }
                })
              )
            }, i * 180)
          )
        }
      }
      timers.push(
        window.setTimeout(() => {
          setActive(false)
          delete document.documentElement.dataset.cheat
        }, PARTY_MS)
      )
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      timers.forEach(clearTimeout)
      delete document.documentElement.dataset.cheat
    }
  }, [])

  return (
    <div
      role='status'
      aria-live='polite'
      className='pointer-events-none fixed inset-x-0 top-[calc(var(--nav-h)+1rem)] z-[60] flex justify-center px-5'
    >
      {active && (
        <p className='cheat-toast rounded-xl border border-white/15 bg-ink-950/85 px-5 py-3 text-center font-pixel text-[12px] tracking-[0.3em] text-bone uppercase shadow-[0_20px_60px_-20px_rgb(0_0_0/0.9)] backdrop-blur-md sm:text-[13px]'>
          Cheat code accepted
          <span className='mt-1.5 block animate-blink text-theme'>+30 lives</span>
        </p>
      )}
    </div>
  )
}
