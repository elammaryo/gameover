'use client'

import { useEffect, useState } from 'react'
import { readSfx, sfx } from '@/lib/sfx'
import { HIT_EVENT, LOGO_GLITCH_EVENT } from '@/lib/stage'

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

/**
 * An easter egg for the ones who try it: the Konami code turns the LED wall
 * into a light show for a few seconds. Nothing else changes.
 */
export function CheatCodes() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    let at = 0
    let timers: number[] = []
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      at = key === CODE[at] ? at + 1 : key === CODE[0] ? 1 : 0
      if (at < CODE.length) return
      at = 0

      timers.forEach(clearTimeout)
      timers = []
      setActive(true)
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
    return () => {
      window.removeEventListener('keydown', onKey)
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
