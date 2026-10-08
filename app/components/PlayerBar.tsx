'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, ListMusic, Maximize2, Shuffle } from 'lucide-react'
import { usePlayer } from '../providers/PlayBarProvider'
import { player } from '../providers/player'
import type { BeatTrack } from '../models/Track'
import { TrackArt } from './Covers'
import { PlayerPanel, type PanelView } from './PlayerPanel'
import { PlayerToasts } from './PlayerToasts'
import { TrackPager } from './TrackPager'
import { EqBars, PlayButton } from './ui'
import {
  PlayerScrubber,
  ProgressLine,
  RepeatButton,
  ShuffleButton,
  SkipButton,
  TrackSwap,
  VolumeControl,
  trackSubline,
  useIsMobile
} from './playerParts'
import type { QueueItem } from '@/lib/queue'
import { cn } from '@/lib/utils'

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return (
    el.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName) ||
    el.getAttribute('role') === 'slider'
  )
}

const iconButton =
  'relative flex size-9 items-center justify-center rounded-full text-bone-muted transition-[color,background-color,scale] duration-150 ease-snap hover:bg-white/[0.06] hover:text-bone active:scale-90'

export function PlayerBar() {
  const p = usePlayer()
  const [panel, setPanel] = useState<PanelView | null>(null)
  const isMobile = useIsMobile()
  const track = p.selectedTrack
  const hasTrack = !!track

  // Space plays / pauses anywhere on the site (unless you're typing)
  useEffect(() => {
    if (!hasTrack) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || isTypingTarget(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      player.toggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasTrack])

  const toggleView = (v: PanelView) => setPanel(cur => (cur === v ? null : v))
  const queued = p.upNext.filter(i => i.from === 'user').length
  const failed = p.status === 'error'

  // artwork + titles; on phones these are pages you swipe between
  const page = (item: QueueItem | null, current: boolean) => (
    <span className='flex min-w-0 items-center gap-3 p-1.5'>
      {item ? (
        <TrackArt
          track={item.track as BeatTrack}
          className='size-11 rounded-lg sm:size-12'
          loading='eager'
          live={current}
        />
      ) : (
        <span className='flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-bone-dim ring-1 ring-white/8 ring-inset'>
          <Shuffle className='size-4' />
        </span>
      )}
      <span className='flex min-w-0 flex-col gap-0.5'>
        <span className='flex min-w-0 items-center gap-2'>
          <span className='truncate text-sm font-semibold text-bone'>
            {item ? item.track.title : 'Shuffling'}
          </span>
          {current && p.isPlaying && !p.isLoading && (
            <EqBars className='hidden sm:inline-flex' />
          )}
        </span>
        <span
          className={cn(
            'flex min-w-0 items-center gap-1.5 truncate text-xs',
            current && failed ? 'text-warn' : 'text-bone-dim'
          )}
        >
          {current && failed && <AlertTriangle className='size-3 shrink-0' />}
          <span className='truncate'>
            {!item
              ? 'Round again'
              : !(current && failed)
                ? trackSubline(item.track)
                : p.offline
                  ? 'Connection lost. Retrying…'
                  : 'Couldn’t play. Press play to retry'}
          </span>
        </span>
      </span>
    </span>
  )

  return (
    <>
      <PlayerPanel view={hasTrack ? panel : null} onViewChange={setPanel} />
      <PlayerToasts docked={hasTrack} />

      <AnimatePresence>
        {track && p.current && (
          <motion.div
            key='dock'
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className='pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 pb-[calc(0.5rem+var(--safe-area-inset-bottom))] sm:px-4 sm:pb-4'
          >
            <section
              aria-label='Player'
              // taps here are controls, not taps along to the beat
              data-no-rhythm
              className='surface-raised pointer-events-auto relative mx-auto max-w-[1240px] overflow-hidden rounded-2xl bg-ink-900/85! backdrop-blur-2xl backdrop-saturate-150'
            >
              {/* phones: progress along the bottom edge */}
              <ProgressLine className='absolute inset-x-3 bottom-0 sm:hidden' />

              <div className='grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 sm:h-[78px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] sm:gap-6 sm:px-3'>
                {/* LEFT: artwork + titles. Opens Now Playing; on phones, swipe
                    sideways for the next or previous track, or up to open */}
                <button
                  type='button'
                  data-shot='open-now-playing'
                  onClick={e => {
                    e.stopPropagation()
                    toggleView('now')
                  }}
                  className='group/np block w-full min-w-0 overflow-hidden rounded-xl text-left transition-colors hover:bg-white/[0.04]'
                  aria-label={`Now playing: ${track.title}. Open player`}
                  aria-expanded={panel !== null}
                >
                  {isMobile ? (
                    <TrackPager gap={24} onSwipeUp={() => setPanel('now')} render={page} />
                  ) : (
                    <TrackSwap id={p.current.uid} direction={p.direction} distance={18}>
                      {page(p.current, true)}
                    </TrackSwap>
                  )}
                </button>

                {/* CENTER: transport + seek (desktop) */}
                <div className='hidden min-w-0 flex-col items-center gap-1 sm:flex'>
                  <div className='flex items-center gap-2'>
                    <ShuffleButton className='hidden md:flex' />
                    <SkipButton dir='prev' />
                    <PlayButton
                      tone='bone'
                      size='md'
                      playing={p.isPlaying}
                      loading={p.isLoading}
                      label={p.isPlaying ? 'Pause' : 'Play'}
                      onClick={e => {
                        e.stopPropagation()
                        p.toggle()
                      }}
                      className='mx-1'
                    />
                    <SkipButton dir='next' />
                    <RepeatButton className='hidden md:flex' />
                  </div>
                  <PlayerScrubber size='sm' className='max-w-[520px]' />
                </div>

                {/* RIGHT: queue, volume, Now Playing (desktop) */}
                <div className='hidden items-center justify-end gap-1 sm:flex'>
                  <button
                    type='button'
                    onClick={() => toggleView('queue')}
                    aria-label={queued ? `Queue, ${queued} added by you` : 'Queue'}
                    aria-pressed={panel === 'queue'}
                    className={cn(iconButton, panel === 'queue' && 'bg-white/[0.06] text-live hover:text-live')}
                  >
                    <ListMusic className='size-[18px]' />
                    {queued > 0 && (
                      <span
                        key={queued}
                        aria-hidden
                        className='badge-pop tabular absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-live px-1 font-mono text-[9.5px] font-semibold text-ink-950'
                      >
                        {queued}
                      </span>
                    )}
                  </button>
                  <VolumeControl />
                  <button
                    type='button'
                    onClick={() => toggleView('now')}
                    aria-label='Open Now Playing'
                    aria-pressed={panel === 'now'}
                    className={cn(iconButton, 'ml-0.5', panel === 'now' && 'bg-white/[0.06] text-bone')}
                  >
                    <Maximize2 className='size-4' />
                  </button>
                </div>

                {/* PHONES: play + next */}
                <div className='flex items-center gap-1 pr-1 sm:hidden'>
                  <PlayButton
                    tone='bone'
                    size='md'
                    playing={p.isPlaying}
                    loading={p.isLoading}
                    label={p.isPlaying ? 'Pause' : 'Play'}
                    onClick={e => {
                      e.stopPropagation()
                      p.toggle()
                    }}
                  />
                  <SkipButton dir='next' className='size-10 text-bone' />
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const hasTrackNow = () => player.getState().queue.index >= 0

/** Keeps page content from ending up underneath the player dock. */
export function PlayerSpacer() {
  const hasTrack = useSyncExternalStore(player.subscribe, hasTrackNow, () => false)
  return (
    <div
      aria-hidden
      className={cn('transition-[height] duration-300', hasTrack ? 'h-24 sm:h-28' : 'h-0')}
    />
  )
}
