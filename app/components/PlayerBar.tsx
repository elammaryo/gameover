'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { AlertTriangle, ListMusic, Maximize2 } from 'lucide-react'
import { usePlayer } from '../providers/PlayBarProvider'
import { player } from '../providers/player'
import type { BeatTrack } from '../models/Track'
import { TrackArt } from './Covers'
import { PlayerPanel, type PanelView } from './PlayerPanel'
import { PlayerToasts } from './PlayerToasts'
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
  // a swipe on the phone dock shouldn't also count as a tap
  const swiped = useRef(false)

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

  const onSwipe = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x + info.velocity.x * 0.2
    if (swipe < -70 && p.canNext) p.onNext()
    else if (swipe > 70) p.onPrev()
  }

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
                {/* LEFT: artwork + titles. Opens Now Playing; swipe to skip on phones */}
                <motion.div
                  className='relative min-w-0'
                  drag={isMobile ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.45}
                  dragSnapToOrigin
                  onPointerDown={() => {
                    swiped.current = false
                  }}
                  // drag end is reported after the click, so mark it here
                  onDragStart={() => {
                    swiped.current = true
                  }}
                  onDragEnd={onSwipe}
                >
                  <button
                    type='button'
                    data-shot='open-now-playing'
                    onClick={e => {
                      e.stopPropagation()
                      if (swiped.current) return
                      toggleView('now')
                    }}
                    className='group/np flex w-full min-w-0 items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white/[0.04]'
                    aria-label={`Now playing: ${track.title}. Open player`}
                    aria-expanded={panel !== null}
                  >
                    <TrackSwap id={p.current.uid} direction={p.direction} distance={18} className='flex min-w-0 items-center gap-3'>
                      <TrackArt
                        track={track as BeatTrack}
                        className='size-11 rounded-lg sm:size-12'
                        live
                      />
                      <span className='flex min-w-0 flex-col gap-0.5'>
                        <span className='flex min-w-0 items-center gap-2'>
                          <span className='truncate text-sm font-semibold text-bone'>
                            {track.title}
                          </span>
                          {p.isPlaying && !p.isLoading && (
                            <EqBars className='hidden sm:inline-flex' />
                          )}
                        </span>
                        <span
                          className={cn(
                            'flex min-w-0 items-center gap-1.5 truncate text-xs',
                            failed ? 'text-warn' : 'text-bone-dim'
                          )}
                        >
                          {failed && <AlertTriangle className='size-3 shrink-0' />}
                          <span className='truncate'>
                            {!failed
                              ? trackSubline(track)
                              : p.offline
                                ? 'Connection lost. Retrying…'
                                : 'Couldn’t play. Press play to retry'}
                          </span>
                        </span>
                      </span>
                    </TrackSwap>
                  </button>
                </motion.div>

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
