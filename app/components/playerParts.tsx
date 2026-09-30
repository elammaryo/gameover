'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import {
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX
} from 'lucide-react'
import ElasticSlider from './ElasticSlider'
import { Scrubber } from './Scrubber'
import { usePlayer, usePlayerVolume } from '../providers/PlayBarProvider'
import { player } from '../providers/player'
import type { BeatTrack, Track } from '../models/Track'
import { usePlayerTime } from '@/lib/playerTime'
import { beatSubtitle } from '@/lib/beats'
import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------------------
   Pieces shared by the player dock, the Now Playing panel and the queue.
--------------------------------------------------------------------------- */

export function trackSubline(track: Track | null) {
  if (!track) return ''
  if (track.source === 'beat') {
    const beat = track as BeatTrack
    const lead = beatSubtitle(beat) ?? beat.genre
    return [lead, beat.bpm ? `${beat.bpm} BPM` : null].filter(Boolean).join(' · ')
  }
  return track.artist ?? ''
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isMobile
}

/** Seek bar wired to the player (re-renders on its own, not its parent). */
export function PlayerScrubber(props: {
  size?: 'sm' | 'md'
  className?: string
  showTimes?: boolean
}) {
  const { current, duration } = usePlayerTime()
  return (
    <Scrubber current={current} duration={duration} onSeek={player.seek} {...props} />
  )
}

/** The thin progress line along the bottom of the phone dock. */
export function ProgressLine({ className }: { className?: string }) {
  const { current, duration } = usePlayerTime()
  const k = duration > 0 ? Math.min(1, current / duration) : 0
  return (
    <div
      aria-hidden
      className={cn('h-[2px] overflow-hidden rounded-full bg-white/8', className)}
    >
      <div
        className='h-full origin-left bg-live shadow-[0_0_8px_rgb(59_231_255/0.8)]'
        style={{ transform: `scaleX(${k})` }}
      />
    </div>
  )
}

/* --- transport ------------------------------------------------------------- */

const roundButton =
  'relative flex items-center justify-center rounded-full text-bone-muted transition-[color,background-color,scale,translate] duration-150 ease-snap hover:bg-white/[0.06] hover:text-bone active:scale-90 disabled:pointer-events-none disabled:opacity-35'

export function SkipButton({
  dir,
  size = 'md',
  className
}: {
  dir: 'prev' | 'next'
  size?: 'md' | 'lg'
  className?: string
}) {
  const { onNext, onPrev, canNext, canPrev } = usePlayer()
  const next = dir === 'next'
  const Icon = next ? SkipForward : SkipBack
  return (
    <button
      type='button'
      onClick={e => {
        e.stopPropagation()
        if (next) onNext()
        else onPrev()
      }}
      disabled={next ? !canNext : !canPrev}
      aria-label={next ? 'Next track' : 'Previous track'}
      className={cn(
        roundButton,
        size === 'lg' ? 'size-12 text-bone' : 'size-9',
        // a small nudge in the direction you're skipping
        next ? 'active:translate-x-[2px]' : 'active:-translate-x-[2px]',
        className
      )}
    >
      <Icon className={size === 'lg' ? 'size-5' : 'size-4'} fill='currentColor' />
    </button>
  )
}

function ToggleDot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-live transition-[opacity,scale] duration-200',
        on ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      )}
    />
  )
}

export function ShuffleButton({
  size = 'md',
  className
}: {
  size?: 'md' | 'lg'
  className?: string
}) {
  const { shuffle, toggleShuffle, selectedTrack } = usePlayer()
  return (
    <button
      type='button'
      onClick={e => {
        e.stopPropagation()
        toggleShuffle()
      }}
      disabled={!selectedTrack}
      aria-label='Shuffle'
      aria-pressed={shuffle}
      title={shuffle ? 'Shuffle is on' : 'Shuffle'}
      className={cn(
        roundButton,
        size === 'lg' ? 'size-12' : 'size-9',
        shuffle && 'text-live hover:text-live',
        className
      )}
    >
      <Shuffle className={size === 'lg' ? 'size-5' : 'size-4'} />
      <ToggleDot on={shuffle} />
    </button>
  )
}

const REPEAT_LABEL = { off: 'Repeat is off', all: 'Repeating the list', one: 'Repeating this track' }

export function RepeatButton({
  size = 'md',
  className
}: {
  size?: 'md' | 'lg'
  className?: string
}) {
  const { repeat, cycleRepeat, selectedTrack } = usePlayer()
  const Icon = repeat === 'one' ? Repeat1 : Repeat
  return (
    <button
      type='button'
      onClick={e => {
        e.stopPropagation()
        cycleRepeat()
      }}
      disabled={!selectedTrack}
      aria-label={`Repeat: ${repeat === 'off' ? 'off' : repeat === 'all' ? 'all' : 'this track'}`}
      title={REPEAT_LABEL[repeat]}
      className={cn(
        roundButton,
        size === 'lg' ? 'size-12' : 'size-9',
        repeat !== 'off' && 'text-live hover:text-live',
        className
      )}
    >
      <Icon className={size === 'lg' ? 'size-5' : 'size-4'} />
      <ToggleDot on={repeat !== 'off'} />
    </button>
  )
}

export function VolumeControl({
  sliderClassName,
  showSlider = 'lg'
}: {
  sliderClassName?: string
  /** from which breakpoint the slider shows next to the mute button */
  showSlider?: 'always' | 'lg'
}) {
  const { effective, muted, setVolume, toggleMute } = usePlayerVolume()
  const pct = Math.round(effective * 100)
  const Icon = pct === 0 ? VolumeX : pct < 50 ? Volume1 : Volume2
  return (
    <div className='flex items-center gap-1' onClick={e => e.stopPropagation()}>
      <button
        type='button'
        onClick={toggleMute}
        aria-label={muted || pct === 0 ? 'Unmute' : 'Mute'}
        aria-pressed={muted}
        className={cn(roundButton, 'size-9')}
      >
        <Icon className='size-[18px]' />
      </button>
      <div
        data-volume-slider
        className={showSlider === 'lg' ? 'hidden lg:block' : undefined}
      >
        <ElasticSlider
          value={pct}
          onChange={v => setVolume(v / 100)}
          maxValue={100}
          startingValue={0}
          className={cn('w-32', sliderClassName)}
        />
      </div>
    </div>
  )
}

/* --- motion ------------------------------------------------------------------- */

const swap: Variants = {
  // `c` = direction × distance: slide in from the side we're heading to;
  // a jump (0) rises in instead
  enter: (c: number) => ({ opacity: 0, x: c, y: c === 0 ? 10 : 0, scale: c === 0 ? 0.97 : 1 }),
  center: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: (c: number) => ({
    opacity: 0,
    x: -c,
    y: c === 0 ? -8 : 0,
    scale: c === 0 ? 0.97 : 1,
    // leave straight away, whatever the entrance delay
    // text crossing text reads as a smudge: the old one clears out quickly
    transition: { type: 'spring', stiffness: 460, damping: 38, opacity: { duration: 0.1 } }
  })
}

/**
 * Swaps its content when `id` changes: the old track slides out one way and
 * the new one comes in from the other, following the skip direction.
 */
export function TrackSwap({
  id,
  direction,
  distance = 28,
  delay = 0,
  className,
  children
}: {
  id: string
  direction: number
  distance?: number
  /** seconds, for staggering several swaps (art, then titles) */
  delay?: number
  className?: string
  children: React.ReactNode
}) {
  const c = direction * distance
  return (
    <AnimatePresence mode='popLayout' initial={false} custom={c}>
      <motion.div
        key={id}
        custom={c}
        variants={swap}
        initial='enter'
        animate='center'
        exit='exit'
        transition={{
          type: 'spring',
          stiffness: 460,
          damping: 38,
          delay,
          opacity: { duration: 0.2, delay }
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
