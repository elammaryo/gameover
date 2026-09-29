'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/** Arcade "CONTINUE? 9 … 0" flourish for the 404 page. Purely decorative. */
export function ContinueCountdown({ from = 9 }: { from?: number }) {
  const [count, setCount] = useState(from)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      setCount(c => {
        if (c <= 1) window.clearInterval(id)
        return Math.max(0, c - 1)
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const done = count === 0

  return (
    <p
      aria-hidden
      className={cn(
        'font-pixel text-xl tracking-[0.18em] uppercase sm:text-2xl',
        done ? 'text-live' : 'text-signal'
      )}
    >
      {done ? (
        <span className='animate-blink'>Insert coin</span>
      ) : (
        <>
          Continue? <span className='tabular inline-block w-[1ch]'>{count}</span>
        </>
      )}
    </p>
  )
}
