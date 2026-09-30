'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { useBeatPulse } from './useBeatPulse'

/**
 * Four little meter bars for "now playing". With a beat on, they ride its
 * kick and hi-hats (see `[data-beat]` in globals.css); for Spotify tracks,
 * which have no tempo here, they bounce on their own.
 */
export function EqBars({
  className,
  playing = true
}: {
  className?: string
  playing?: boolean
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useBeatPulse(ref)
  return (
    <span
      ref={ref}
      aria-hidden
      className={cn('inline-flex h-3.5 items-end gap-[2px]', className)}
    >
      {[0, 180, 90, 260].map((delay, i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] rounded-[1px] bg-live',
            playing ? 'eq-bar h-full' : 'h-1'
          )}
          style={playing ? { animationDelay: `${delay}ms` } : undefined}
        />
      ))}
    </span>
  )
}
