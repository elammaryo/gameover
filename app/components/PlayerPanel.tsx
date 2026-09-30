'use client'

import { useEffect, useRef } from 'react'
import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo
} from 'motion/react'
import { ChevronDown, ChevronRight, ListMusic, X } from 'lucide-react'
import type { BeatTrack, SpotifyTrack, Track } from '../models/Track'
import { usePlayer } from '../providers/PlayBarProvider'
import { TrackArt } from './Covers'
import { QueueList } from './QueueList'
import { useFocusTrap } from './useFocusTrap'
import { EqBars, PlayButton, Tag } from './ui'
import {
  PlayerScrubber,
  RepeatButton,
  ShuffleButton,
  SkipButton,
  TrackSwap,
  VolumeControl,
  trackSubline,
  useIsMobile
} from './playerParts'
import { accentFor, beatSubtitle } from '@/lib/beats'
import { cn } from '@/lib/utils'

export type PanelView = 'now' | 'queue'

const VIEWS: Array<{ id: PanelView; label: string }> = [
  { id: 'now', label: 'Now playing' },
  { id: 'queue', label: 'Queue' }
]

const accentOf = (track: Track) =>
  track.source === 'beat' ? accentFor(track as BeatTrack) : '#1ED760'

function detailsOf(track: Track) {
  if (track.source === 'beat') {
    const b = track as BeatTrack
    return [
      { label: 'Genre', value: b.genre },
      { label: 'Tempo', value: `${b.bpm} BPM` },
      { label: 'Key', value: b.key ?? '—' },
      { label: 'Mood', value: b.mood ?? '—' }
    ]
  }
  const s = track as SpotifyTrack
  return [
    { label: 'Album', value: s.album?.name ?? '—' },
    { label: 'Artists', value: s.artists?.map(a => a.name).join(', ') ?? '—' }
  ]
}

function SourceTag({ track }: { track: Track }) {
  const beat = track.source === 'beat'
  return (
    <Tag dot={beat ? 'var(--color-signal)' : 'var(--color-spotify)'}>
      {beat ? 'GameOver beat' : 'Spotify'}
    </Tag>
  )
}

/** A soft wash of the track's colour behind the panel, crossfading on change. */
function AccentWash({ track, shape }: { track: Track; shape: string }) {
  const accent = accentOf(track)
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={accent}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className='pointer-events-none absolute inset-0 -z-10'
        style={{ backgroundImage: `radial-gradient(${shape}, ${accent}2b, transparent 65%)` }}
      />
    </AnimatePresence>
  )
}

/**
 * Now Playing + queue. Desktop: a floating panel on the right, clear of the
 * dock, with two tabs. Phones: a full-screen sheet you can drag down to
 * close; swipe the artwork to skip.
 */
export function PlayerPanel({
  view,
  onViewChange
}: {
  view: PanelView | null
  onViewChange: (view: PanelView | null) => void
}) {
  const isMobile = useIsMobile()
  const p = usePlayer()
  const open = view !== null && !!p.current
  const close = () => onViewChange(null)

  // Escape closes; focus moves in on open and back out on close
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onViewChange(null)
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => closeRef.current?.focus(), 60)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
      previous?.focus?.()
    }
  }, [open, onViewChange])

  return isMobile ? (
    <MobileSheet open={open} view={view ?? 'now'} onViewChange={onViewChange} onClose={close} closeRef={closeRef} />
  ) : (
    <DesktopPanel open={open} view={view ?? 'now'} onViewChange={onViewChange} onClose={close} closeRef={closeRef} />
  )
}

type ViewProps = {
  open: boolean
  view: PanelView
  onViewChange: (view: PanelView | null) => void
  onClose: () => void
  closeRef: React.RefObject<HTMLButtonElement | null>
}

/* --- desktop ------------------------------------------------------------------ */

const tabId = (v: PanelView) => `player-tab-${v}`
// one id per view: during the crossfade both panels are briefly on screen
const panelId = (v: PanelView) => `player-tabpanel-${v}`

function Tabs({ view, onChange }: { view: PanelView; onChange: (v: PanelView) => void }) {
  const list = useRef<HTMLDivElement>(null)
  // arrow keys move between tabs (and focus follows)
  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = VIEWS.findIndex(v => v.id === view)
    let to = -1
    if (e.key === 'ArrowRight') to = (at + 1) % VIEWS.length
    else if (e.key === 'ArrowLeft') to = (at - 1 + VIEWS.length) % VIEWS.length
    else if (e.key === 'Home') to = 0
    else if (e.key === 'End') to = VIEWS.length - 1
    if (to < 0) return
    e.preventDefault()
    onChange(VIEWS[to].id)
    list.current?.querySelector<HTMLElement>(`#${tabId(VIEWS[to].id)}`)?.focus()
  }
  return (
    <div
      ref={list}
      role='tablist'
      aria-label='Player'
      onKeyDown={onKeyDown}
      className='relative flex rounded-full bg-white/[0.05] p-1'
    >
      {VIEWS.map(v => {
        const active = v.id === view
        return (
          <button
            key={v.id}
            id={tabId(v.id)}
            type='button'
            role='tab'
            aria-selected={active}
            aria-controls={panelId(v.id)}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(v.id)}
            className={cn(
              'relative h-8 rounded-full px-3.5 text-[13px] font-semibold transition-colors',
              active ? 'text-ink-950' : 'text-bone-muted hover:text-bone'
            )}
          >
            {active && (
              <motion.span
                layoutId='player-panel-tab'
                className='absolute inset-0 rounded-full bg-bone'
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              />
            )}
            <span className='relative'>{v.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function DesktopPanel({ open, view, onViewChange, onClose, closeRef }: ViewProps) {
  const p = usePlayer()
  const track = p.selectedTrack
  const dir = view === 'queue' ? 1 : -1

  return (
    <AnimatePresence>
      {open && track && (
        <motion.aside
          role='dialog'
          aria-modal='false'
          aria-label='Now playing and queue'
          initial={{ x: 40, opacity: 0, scale: 0.98 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 40, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className='surface-raised fixed top-[calc(var(--nav-h)+0.75rem)] right-4 bottom-[7.25rem] z-[61] isolate flex w-[400px] origin-right flex-col overflow-hidden rounded-2xl bg-ink-950/92! backdrop-blur-2xl'
        >
          <AccentWash track={track} shape='90% 45% at 50% 0%' />
          <div className='flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3'>
            <Tabs view={view} onChange={onViewChange} />
            <button
              ref={closeRef}
              type='button'
              onClick={onClose}
              aria-label='Close player panel'
              className='flex size-9 items-center justify-center rounded-lg text-bone-muted transition-colors hover:bg-white/[0.06] hover:text-bone'
            >
              <X className='size-[18px]' />
            </button>
          </div>

          <div className='relative flex-1 overflow-x-hidden overflow-y-auto overscroll-contain'>
            <AnimatePresence mode='popLayout' initial={false} custom={dir}>
              <motion.div
                key={view}
                id={panelId(view)}
                role='tabpanel'
                aria-labelledby={tabId(view)}
                custom={dir}
                initial={{ opacity: 0, x: dir * 36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -36 }}
                transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                className='px-5 pt-5 pb-8'
              >
                {view === 'now' ? (
                  <DesktopNow onOpenQueue={() => onViewChange('queue')} />
                ) : (
                  <QueueList />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function DesktopNow({ onOpenQueue }: { onOpenQueue: () => void }) {
  const p = usePlayer()
  const item = p.current
  if (!item) return null
  const track = item.track
  const beat = track.source === 'beat' ? (track as BeatTrack) : null
  const subtitle = beat ? (beatSubtitle(beat) ?? beat.artist) : track.artist
  const details = detailsOf(track)

  return (
    <div>
      <div className='relative'>
        <TrackSwap id={item.uid} direction={p.direction} distance={56}>
          <TrackArt
            track={track as BeatTrack}
            className='w-full rounded-2xl shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]'
            sizes='360px'
            glow
            detail
            live
          />
        </TrackSwap>
      </div>

      <div className='relative mt-6'>
        <TrackSwap id={item.uid} direction={p.direction} distance={24} delay={0.04}>
          <div className='mb-3 flex items-center gap-2'>
            <SourceTag track={track} />
            {p.isPlaying && <EqBars />}
          </div>
          <h2 className='font-display-tight text-[1.75rem] text-bone'>{track.title}</h2>
          <p className='mt-1.5 text-[15px] text-bone-muted'>{subtitle}</p>
        </TrackSwap>
      </div>

      <dl className='mt-6 grid grid-cols-2 overflow-hidden rounded-xl border border-line'>
        {details.map((d, i) => (
          <div
            key={d.label}
            className={cn(
              'flex min-w-0 flex-col gap-1.5 px-4 py-3',
              i % 2 === 1 && 'border-l border-line',
              i >= 2 && 'border-t border-line'
            )}
          >
            <dt className='hud-label'>{d.label}</dt>
            <dd className='truncate text-sm font-medium text-bone'>{d.value}</dd>
          </div>
        ))}
      </dl>

      {beat?.tags && beat.tags.length > 0 && (
        <div className='mt-4 flex flex-wrap gap-1.5'>
          {beat.tags.map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      )}

      <UpNextPeek onOpenQueue={onOpenQueue} className='mt-8' />
    </div>
  )
}

/** The next couple of tracks, with a way into the full queue. */
function UpNextPeek({
  onOpenQueue,
  className
}: {
  onOpenQueue: () => void
  className?: string
}) {
  const p = usePlayer()
  const next = p.upNext.slice(0, 3)
  return (
    <section className={className} aria-label='Up next'>
      <div className='mb-2.5 flex items-center justify-between'>
        <h3 className='hud-label'>Up next</h3>
        <button
          type='button'
          onClick={onOpenQueue}
          className='hud-label flex items-center gap-1 rounded-md px-1.5 py-1 text-bone-muted transition-colors hover:text-bone'
        >
          Queue
          <span className='tabular text-bone-dim'>{p.upNext.length}</span>
          <ChevronRight className='size-3.5' />
        </button>
      </div>
      {next.length ? (
        <ol className='flex flex-col gap-0.5'>
          <AnimatePresence initial={false} mode='popLayout'>
            {next.map(item => (
              <motion.li
                key={item.uid}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 460, damping: 38 }}
              >
                <button
                  type='button'
                  onClick={() => p.jumpTo(item.uid)}
                  aria-label={`Play ${item.track.title}`}
                  className='flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.05]'
                >
                  <TrackArt track={item.track as BeatTrack} className='size-10 rounded-lg' sizes='40px' />
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-medium text-bone'>
                      {item.track.title}
                    </span>
                    <span className='block truncate text-xs text-bone-dim'>
                      {trackSubline(item.track)}
                    </span>
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      ) : (
        <p className='rounded-xl border border-dashed border-line px-4 py-4 text-center text-xs text-bone-dim'>
          That’s the end of the queue.
        </p>
      )}
    </section>
  )
}

/* --- phone ---------------------------------------------------------------------- */

function MobileSheet({ open, view, onViewChange, onClose, closeRef }: ViewProps) {
  const p = usePlayer()
  const track = p.selectedTrack
  const sheet = useRef<HTMLDivElement>(null)
  const drag = useDragControls()

  // modal on phones: keep focus inside, the page from scrolling behind it,
  // and everything behind it out of reach of screen readers (inert)
  useFocusTrap(sheet, open)
  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const el = sheet.current
    const behind = Array.from(document.body.children).filter(
      (n): n is HTMLElement =>
        n instanceof HTMLElement &&
        !!el &&
        n !== el &&
        !n.contains(el) &&
        !n.hasAttribute('data-keep-live')
    )
    const before = behind.map(n => n.inert)
    behind.forEach(n => (n.inert = true))
    return () => {
      document.body.style.overflow = overflow
      behind.forEach((n, i) => (n.inert = before[i]))
    }
  }, [open])

  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, [role="slider"]')) return
    drag.start(e)
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 140 || info.velocity.y > 650) onClose()
  }

  const queueOpen = view === 'queue'

  return (
    <AnimatePresence>
      {open && track && (
        <motion.div
          ref={sheet}
          role='dialog'
          aria-modal='true'
          aria-label={queueOpen ? 'Queue' : 'Now playing'}
          drag='y'
          dragListener={false}
          dragControls={drag}
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.85 }}
          onDragEnd={onDragEnd}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 36, stiffness: 340 }}
          className='fixed inset-0 z-[61] isolate flex flex-col overflow-hidden rounded-t-[28px] bg-ink-950 shadow-[0_-30px_80px_-30px_rgb(0_0_0/0.9)]'
        >
          <AccentWash track={track} shape='120% 60% at 50% 0%' />

          {/* header: drag it down to close */}
          <div
            onPointerDown={startDrag}
            className='shrink-0 touch-none px-3 pt-[calc(0.5rem+var(--safe-area-inset-top))]'
          >
            <div className='mx-auto mb-2 h-1 w-10 rounded-full bg-white/25' aria-hidden />
            <div className='flex items-center justify-between gap-2 pb-2'>
              <button
                ref={closeRef}
                type='button'
                onClick={onClose}
                aria-label='Close player'
                className='flex size-10 items-center justify-center rounded-full text-bone-muted transition-colors active:bg-white/10'
              >
                <ChevronDown className='size-6' />
              </button>
              <div className='min-w-0 text-center'>
                <p className='hud-label'>{queueOpen ? 'Queue' : 'Now playing'}</p>
                {p.contextName && (
                  <p className='mt-0.5 truncate text-xs text-bone-muted'>{p.contextName}</p>
                )}
              </div>
              <button
                type='button'
                onClick={() => onViewChange(queueOpen ? 'now' : 'queue')}
                aria-label={queueOpen ? 'Back to now playing' : 'Open the queue'}
                aria-pressed={queueOpen}
                className={cn(
                  'flex size-10 items-center justify-center rounded-full transition-colors active:bg-white/10',
                  queueOpen ? 'text-live' : 'text-bone-muted'
                )}
              >
                <ListMusic className='size-[22px]' />
              </button>
            </div>
          </div>

          <div className='relative flex-1 overflow-x-hidden overflow-y-auto overscroll-contain'>
            <AnimatePresence mode='popLayout' initial={false} custom={queueOpen ? 1 : -1}>
              <motion.div
                key={view}
                initial={{ opacity: 0, x: queueOpen ? 48 : -48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: queueOpen ? -48 : 48 }}
                transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                className='min-h-full px-6 pb-[calc(1.5rem+var(--safe-area-inset-bottom))]'
              >
                {queueOpen ? (
                  <QueueList className='pt-2' />
                ) : (
                  <MobileNow onPullStart={startDrag} onOpenQueue={() => onViewChange('queue')} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MobileNow({
  onPullStart,
  onOpenQueue
}: {
  onPullStart: (e: React.PointerEvent) => void
  onOpenQueue: () => void
}) {
  const p = usePlayer()
  const item = p.current
  if (!item) return null
  const track = item.track
  const beat = track.source === 'beat' ? (track as BeatTrack) : null
  const subtitle = beat ? (beatSubtitle(beat) ?? beat.artist) : track.artist
  const nextUp = p.upNext[0]

  const onSwipe = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x + info.velocity.x * 0.2
    if (swipe < -80 && p.canNext) p.onNext()
    else if (swipe > 80) p.onPrev()
  }

  return (
    <div className='mx-auto flex min-h-full w-full max-w-[420px] flex-col items-center justify-center gap-6 py-3'>
      {/* swipe sideways to skip; pull down to close */}
      <div className='relative w-full max-w-[min(100%,calc(100svh-27.5rem))]'>
        <TrackSwap id={item.uid} direction={p.direction} distance={120}>
          <motion.div
            drag='x'
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.55}
            dragSnapToOrigin
            onDragEnd={onSwipe}
            onPointerDown={onPullStart}
            whileDrag={{ scale: 0.97 }}
            data-shot='np-art'
            className='touch-none'
          >
            <TrackArt
              track={track as BeatTrack}
              className='w-full rounded-3xl shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]'
              sizes='(max-width: 768px) 85vw, 400px'
              glow
              detail
              priority
              live
            />
          </motion.div>
        </TrackSwap>
      </div>

      <div className='relative w-full'>
        <TrackSwap id={item.uid} direction={p.direction} distance={32} delay={0.05}>
          <div className='mb-3 flex items-center gap-2'>
            <SourceTag track={track} />
            {p.isPlaying && <EqBars />}
          </div>
          <h2 className='font-display-tight text-[1.75rem] leading-tight text-bone'>
            {track.title}
          </h2>
          <p className='mt-1.5 truncate text-sm text-bone-muted'>{subtitle}</p>
        </TrackSwap>
      </div>

      <PlayerScrubber className='w-full' />

      <div className='flex w-full items-center justify-between'>
        <ShuffleButton size='lg' />
        <SkipButton dir='prev' size='lg' />
        <PlayButton
          tone='bone'
          size='xl'
          playing={p.isPlaying}
          loading={p.isLoading}
          label={p.isPlaying ? 'Pause' : 'Play'}
          onClick={() => p.toggle()}
        />
        <SkipButton dir='next' size='lg' />
        <RepeatButton size='lg' />
      </div>

      <button
        type='button'
        onClick={onOpenQueue}
        className='flex w-full items-center gap-3 rounded-2xl border border-line bg-white/[0.03] p-2.5 text-left transition-colors active:bg-white/[0.06]'
      >
        <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-bone-muted'>
          <ListMusic className='size-[18px]' />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='hud-label block'>Up next</span>
          <span className='block truncate text-sm font-medium text-bone'>
            {nextUp ? nextUp.track.title : 'End of the queue'}
          </span>
        </span>
        <ChevronRight className='size-4 shrink-0 text-bone-dim' />
      </button>

      {/* phones set the volume with their buttons; this only shows on tablets */}
      <div className='hidden w-full justify-center sm:flex'>
        <VolumeControl showSlider='always' sliderClassName='w-52' />
      </div>
    </div>
  )
}
