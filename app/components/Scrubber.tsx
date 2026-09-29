'use client'

import { useRef, useState } from 'react'
import { formatClock } from '@/lib/beats'
import { cn } from '@/lib/utils'

type ScrubberProps = {
  current: number
  duration: number
  onSeek: (seconds: number) => void
  className?: string
  /** show elapsed / total on either side */
  showTimes?: boolean
  size?: 'sm' | 'md'
}

/**
 * Seek bar: click, drag, or use arrow keys (±5s). While dragging it previews
 * the position and only seeks on release, so audio doesn't stutter.
 */
export function Scrubber({
  current,
  duration,
  onSeek,
  className,
  showTimes = true,
  size = 'md'
}: ScrubberProps) {
  const track = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<number | null>(null)
  const ready = duration > 0
  const shown = drag ?? current
  const pct = ready ? Math.min(100, Math.max(0, (shown / duration) * 100)) : 0

  const timeAt = (clientX: number) => {
    const el = track.current
    if (!el || !ready) return 0
    const r = el.getBoundingClientRect()
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * duration
  }

  return (
    <div className={cn('flex w-full items-center gap-3', className)}>
      {showTimes && (
        <span className='tabular w-9 text-right font-mono text-[11px] text-bone-dim'>
          {formatClock(shown)}
        </span>
      )}
      <div
        ref={track}
        role='slider'
        tabIndex={ready ? 0 : -1}
        aria-label='Seek'
        aria-valuemin={0}
        aria-valuemax={Math.round(duration) || 0}
        aria-valuenow={Math.round(shown) || 0}
        aria-valuetext={`${formatClock(shown)} of ${formatClock(duration)}`}
        aria-disabled={!ready}
        className={cn(
          'group/scrub relative flex flex-1 cursor-pointer touch-none items-center',
          size === 'md' ? 'h-5' : 'h-4',
          !ready && 'cursor-default'
        )}
        onPointerDown={e => {
          if (!ready) return
          e.stopPropagation()
          e.currentTarget.setPointerCapture(e.pointerId)
          setDrag(timeAt(e.clientX))
        }}
        onPointerMove={e => {
          if (drag === null) return
          setDrag(timeAt(e.clientX))
        }}
        onPointerUp={e => {
          if (drag === null) return
          e.stopPropagation()
          onSeek(timeAt(e.clientX))
          setDrag(null)
        }}
        onPointerCancel={() => setDrag(null)}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => {
          if (!ready) return
          const step = e.shiftKey ? 15 : 5
          let next: number | null = null
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = current + step
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = current - step
          if (e.key === 'Home') next = 0
          if (e.key === 'End') next = duration - 1
          if (next !== null) {
            e.preventDefault()
            e.stopPropagation()
            onSeek(Math.min(duration, Math.max(0, next)))
          }
        }}
      >
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-white/12 transition-[height] duration-150',
            size === 'md' ? 'h-1 group-hover/scrub:h-1.5' : 'h-[3px]',
            drag !== null && 'h-1.5'
          )}
        >
          <div
            className='absolute inset-y-0 left-0 rounded-full bg-live shadow-[0_0_12px_rgb(59_231_255/0.7)]'
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bone shadow-[0_0_0_3px_rgb(59_231_255/0.25)] transition-opacity duration-150',
            drag !== null
              ? 'opacity-100'
              : 'opacity-0 group-hover/scrub:opacity-100 group-focus-visible/scrub:opacity-100'
          )}
          style={{ left: `${pct}%` }}
        />
      </div>
      {showTimes && (
        <span className='tabular w-9 font-mono text-[11px] text-bone-dim'>
          {formatClock(duration)}
        </span>
      )}
    </div>
  )
}
