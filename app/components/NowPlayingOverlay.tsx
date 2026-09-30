'use client'
import { useContext, useState, useRef, useEffect } from 'react'
import { PlayBarContext } from '../providers/PlayBarProvider'
import Image from 'next/image'
import {
  ChevronDown,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X
} from 'lucide-react'
import { BeatTrack, SpotifyTrack, Track } from '../models/Track'
import ElasticSlider from './ElasticSlider'
import { motion, AnimatePresence } from 'motion/react'
import { TrackArt } from './Covers'
import { useFocusTrap } from './useFocusTrap'
import { Scrubber } from './Scrubber'
import { EqBars, PlayButton, Tag } from './ui'
import { accentFor, beatSubtitle } from '@/lib/beats'
import { cn } from '@/lib/utils'

interface NowPlayingOverlayProps {
  isOpen: boolean
  onClose: () => void
  currentTime: number
  duration: number
  volume: number
  onVolumeChange: (value: number) => void
  onSeek: (time: number) => void
  queue?: Track[]
}

export function NowPlayingOverlay({
  isOpen,
  onClose,
  currentTime,
  duration,
  volume,
  onVolumeChange,
  onSeek,
  queue = []
}: NowPlayingOverlayProps) {
  const {
    selectedTrack,
    isPlaying,
    setPlayPause,
    onNext,
    onPrev,
    setTrack,
    setQueue
  } = useContext(PlayBarContext)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null
  )
  const [touchStartTime, setTouchStartTime] = useState<number>(0)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null
  )
  const [, setIsTransitioning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // the phone sheet is modal: keep keyboard focus inside it
  useFocusTrap(overlayRef, isOpen && isMobile)

  // Get upcoming tracks (tracks after the currently playing one)
  const currentTrackIndex = queue.findIndex(t => t.id === selectedTrack?.id)
  const upcomingTracks =
    currentTrackIndex >= 0 ? queue.slice(currentTrackIndex + 1) : []

  // Get next and previous tracks for mobile preview
  const nextTrack =
    currentTrackIndex >= 0 && currentTrackIndex < queue.length - 1
      ? queue[currentTrackIndex + 1]
      : null
  const prevTrack = currentTrackIndex > 0 ? queue[currentTrackIndex - 1] : null

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Move focus into the panel when it opens, and back when it closes
  useEffect(() => {
    if (!isOpen) return
    const previous = document.activeElement as HTMLElement | null
    const t = window.setTimeout(() => closeRef.current?.focus(), 50)
    return () => {
      window.clearTimeout(t)
      previous?.focus?.()
    }
  }, [isOpen])

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-scrollable]') || target.closest('[role="slider"]'))
      return

    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
    setTouchStartTime(Date.now())
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !contentRef.current || !overlayRef.current) return

    const currentY = e.targetTouches[0].clientY
    const currentX = e.targetTouches[0].clientX
    const diffY = currentY - touchStart.y
    const diffX = Math.abs(currentX - touchStart.x)

    const isAtTop = contentRef.current.scrollTop === 0
    const isDraggingDown = diffY > 0
    const isVerticalDrag = Math.abs(diffY) > diffX

    if (isAtTop && isDraggingDown && isVerticalDrag) {
      e.preventDefault()
      overlayRef.current.style.transform = `translateY(${diffY * 0.6}px)`
      overlayRef.current.style.transition = 'none'
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !overlayRef.current) return

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }

    const diffY = touchEnd.y - touchStart.y
    const diffX = touchEnd.x - touchStart.x
    const distance = Math.abs(diffX)
    const timeElapsed = Date.now() - touchStartTime
    const velocity = distance / timeElapsed
    const isVerticalDrag = Math.abs(diffY) > Math.abs(diffX)

    overlayRef.current.style.transition = ''

    // Swipe down to close
    if (diffY > 150 && isVerticalDrag) {
      overlayRef.current.style.transform = 'translateY(100%)'
      setTimeout(() => {
        onClose()
        if (overlayRef.current) {
          overlayRef.current.style.transform = ''
        }
      }, 300)
    } else if (isVerticalDrag) {
      overlayRef.current.style.transform = 'translateY(0)'
    } else {
      // Horizontal swipe to change track
      const minSwipeDistance = 60
      const minVelocity = 0.3

      overlayRef.current.style.transform = 'translateY(0)'

      if (distance > minSwipeDistance && velocity > minVelocity) {
        if (diffX < 0 && nextTrack) {
          setSwipeDirection('left')
          setIsTransitioning(true)
          setTimeout(() => {
            onNext()
            setTimeout(() => {
              setIsTransitioning(false)
              setSwipeDirection(null)
            }, 400)
          }, 50)
        } else if (diffX > 0 && prevTrack) {
          setSwipeDirection('right')
          setIsTransitioning(true)
          setTimeout(() => {
            onPrev()
            setTimeout(() => {
              setIsTransitioning(false)
              setSwipeDirection(null)
            }, 400)
          }, 50)
        }
      }
    }

    setTouchStart(null)
    setTouchStartTime(0)
  }

  const handlePlayPause = () => {
    setPlayPause(!isPlaying)
    if (selectedTrack?.source === 'spotify') {
      const player = window.spotifyPlayerInstance
      if (!isPlaying) {
        player?.resume()
      } else {
        player?.pause()
      }
    }
  }

  const playFromQueue = async (track: Track) => {
    if (track.source !== 'beat') return
    await setTrack(track)
    setQueue(track, queue)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateScrollLock = () => {
      const isMobile = window.innerWidth < 768

      if (isOpen && isMobile) {
        const scrollbarWidth =
          window.innerWidth - document.documentElement.clientWidth
        document.body.style.overflow = 'hidden'
        document.body.style.paddingRight = `${scrollbarWidth}px`
      } else {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }
    }

    updateScrollLock()

    window.addEventListener('resize', updateScrollLock)

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      window.removeEventListener('resize', updateScrollLock)
    }
  }, [isOpen])

  if (!isOpen || !selectedTrack) return null

  const isBeat = selectedTrack.source === 'beat'
  const beatTrack = isBeat ? (selectedTrack as BeatTrack) : null
  const spotifyTrack = !isBeat ? (selectedTrack as SpotifyTrack) : null
  const accent = beatTrack ? accentFor(beatTrack) : '#1ED760'
  const subtitle = beatTrack
    ? (beatSubtitle(beatTrack) ?? beatTrack.artist)
    : selectedTrack.artist

  const details = beatTrack
    ? [
        { label: 'Genre', value: beatTrack.genre },
        { label: 'Tempo', value: `${beatTrack.bpm} BPM` },
        { label: 'Key', value: beatTrack.key ?? '—' },
        { label: 'Mood', value: beatTrack.mood ?? '—' }
      ]
    : spotifyTrack
      ? [
          { label: 'Album', value: spotifyTrack.album?.name ?? '—' },
          {
            label: 'Artists',
            value: spotifyTrack.artists?.map(a => a.name).join(', ') ?? '—'
          }
        ]
      : []

  const sourceTag = (
    <Tag dot={isBeat ? 'var(--color-signal)' : 'var(--color-spotify)'}>
      {isBeat ? 'GameOver beat' : 'Spotify'}
    </Tag>
  )

  const transport = (big: boolean) => (
    <div className='flex items-center justify-center gap-5'>
      <button
        type='button'
        onClick={onPrev}
        disabled={big ? !prevTrack : !selectedTrack}
        aria-label='Previous track'
        className='flex size-12 items-center justify-center rounded-full text-bone transition-[translate,scale,background-color] hover:bg-white/[0.06] active:scale-95 disabled:opacity-30'
      >
        <SkipBack className='size-5' fill='currentColor' />
      </button>
      <PlayButton
        tone='bone'
        size='xl'
        playing={isPlaying}
        label={isPlaying ? 'Pause' : 'Play'}
        onClick={handlePlayPause}
        disabled={!selectedTrack}
      />
      <button
        type='button'
        onClick={onNext}
        disabled={big ? !nextTrack : !selectedTrack}
        aria-label='Next track'
        className='flex size-12 items-center justify-center rounded-full text-bone transition-[translate,scale,background-color] hover:bg-white/[0.06] active:scale-95 disabled:opacity-30'
      >
        <SkipForward className='size-5' fill='currentColor' />
      </button>
    </div>
  )

  const queueList = upcomingTracks.length > 0 && (
    <div data-scrollable className='w-full'>
      <div className='mb-3 flex items-baseline justify-between'>
        <h3 className='hud-label'>Up next</h3>
        <span className='tabular font-mono text-[11px] text-bone-dim'>
          {upcomingTracks.length}
        </span>
      </div>
      <ol className='space-y-1'>
        {upcomingTracks.slice(0, 10).map((track, index) => {
          const clickable = track.source === 'beat'
          const rowClass = cn(
            'flex w-full items-center gap-3 rounded-xl p-2 text-left',
            clickable && 'transition-colors hover:bg-white/[0.05]'
          )
          const inner = (
            <>
              <span className='tabular w-5 text-center font-mono text-[11px] text-bone-dim'>
                {index + 1}
              </span>
              <TrackArt
                track={track as BeatTrack}
                className='size-10 rounded-lg'
                sizes='40px'
              />
              <span className='min-w-0 flex-1'>
                <span className='block truncate text-sm font-medium text-bone'>
                  {track.title}
                </span>
                <span className='block truncate text-xs text-bone-dim'>
                  {track.source === 'beat'
                    ? (beatSubtitle(track as BeatTrack) ??
                      (track as BeatTrack).genre)
                    : track.artist}
                </span>
              </span>
              {track.source === 'beat' && (
                <span className='tabular font-mono text-[11px] text-bone-dim'>
                  {(track as BeatTrack).bpm}
                </span>
              )}
            </>
          )
          return (
            <li key={track.id}>
              {clickable ? (
                <button
                  type='button'
                  onClick={() => playFromQueue(track)}
                  aria-label={`Play ${track.title}`}
                  className={rowClass}
                >
                  {inner}
                </button>
              ) : (
                <div className={rowClass}>{inner}</div>
              )}
            </li>
          )
        })}
      </ol>
      {upcomingTracks.length > 10 && (
        <p className='py-3 text-center font-mono text-[11px] text-bone-dim'>
          +{upcomingTracks.length - 10} more
        </p>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role='dialog'
            aria-modal='true'
            aria-label='Now playing'
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300
            }}
            className='fixed inset-0 z-[61] flex flex-col bg-ink-950'
            style={{
              backgroundImage: `radial-gradient(120% 60% at 50% 0%, ${accent}26, transparent 60%)`
            }}
            ref={overlayRef}
          >
            {/* Swipe indicator */}
            <div className='flex flex-shrink-0 justify-center pt-[calc(0.5rem+var(--safe-area-inset-top))] pb-2'>
              <div className='h-1 w-10 rounded-full bg-white/25' />
            </div>

            {/* Header */}
            <div className='flex flex-shrink-0 items-center justify-between px-3 pb-2'>
              <button
                ref={closeRef}
                type='button'
                onClick={onClose}
                aria-label='Close player'
                className='flex size-10 items-center justify-center rounded-full text-bone-muted transition-colors active:bg-white/10'
              >
                <ChevronDown className='size-6' />
              </button>
              <span className='hud-label'>Now playing</span>
              <span className='size-10' aria-hidden />
            </div>

            <div
              ref={contentRef}
              className='flex-1 overflow-x-hidden overflow-y-auto px-6 pb-[calc(1.5rem+var(--safe-area-inset-bottom))]'
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className='mx-auto flex min-h-full w-full max-w-[400px] flex-col items-center justify-center gap-7 py-2'>
                {/* Artwork with swipe animation */}
                <div className='relative w-full'>
                  <AnimatePresence mode='popLayout' initial={false}>
                    <motion.div
                      key={selectedTrack.id}
                      initial={
                        swipeDirection === 'left'
                          ? { x: '100%', opacity: 0, scale: 0.8 }
                          : swipeDirection === 'right'
                            ? { x: '-100%', opacity: 0, scale: 0.8 }
                            : false
                      }
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      exit={
                        swipeDirection === 'left'
                          ? { x: '-100%', opacity: 0, scale: 0.8 }
                          : swipeDirection === 'right'
                            ? { x: '100%', opacity: 0, scale: 0.8 }
                            : { opacity: 0 }
                      }
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        opacity: { duration: 0.2 }
                      }}
                      className='relative w-full'
                    >
                      <TrackArt
                        track={selectedTrack as BeatTrack}
                        className='w-full rounded-3xl shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]'
                        sizes='(max-width: 768px) 85vw, 400px'
                        glow
                        detail
                        priority
                        live
                      />
                    </motion.div>
                  </AnimatePresence>

                  {touchStart && (
                    <>
                      {nextTrack && nextTrack.artworkUrl && (
                        <div className='pointer-events-none absolute top-0 -right-16 h-full w-16 opacity-40'>
                          <Image
                            src={nextTrack.artworkUrl}
                            alt=''
                            fill
                            sizes='64px'
                            className='rounded-l-2xl object-cover'
                          />
                        </div>
                      )}
                      {prevTrack && prevTrack.artworkUrl && (
                        <div className='pointer-events-none absolute top-0 -left-16 h-full w-16 opacity-40'>
                          <Image
                            src={prevTrack.artworkUrl}
                            alt=''
                            fill
                            sizes='64px'
                            className='rounded-r-2xl object-cover'
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Track info */}
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={selectedTrack.id}
                    initial={
                      swipeDirection
                        ? {
                            x: swipeDirection === 'left' ? 50 : -50,
                            opacity: 0
                          }
                        : false
                    }
                    animate={{ x: 0, opacity: 1 }}
                    exit={
                      swipeDirection
                        ? {
                            x: swipeDirection === 'left' ? -50 : 50,
                            opacity: 0
                          }
                        : { opacity: 0 }
                    }
                    transition={{ duration: 0.3 }}
                    className='w-full'
                  >
                    <div className='mb-3 flex items-center gap-2'>
                      {sourceTag}
                      {isPlaying && <EqBars />}
                    </div>
                    <h2 className='font-display-tight text-[1.75rem] text-bone'>
                      {selectedTrack.title}
                    </h2>
                    <p className='mt-1.5 text-sm text-bone-muted'>{subtitle}</p>

                    {beatTrack && (
                      <div className='mt-4 flex flex-wrap gap-1.5'>
                        <Tag>{beatTrack.genre}</Tag>
                        <Tag>{beatTrack.bpm} BPM</Tag>
                        {beatTrack.key && <Tag>{beatTrack.key}</Tag>}
                        {beatTrack.mood && (
                          <Tag dot={accentFor(beatTrack)}>{beatTrack.mood}</Tag>
                        )}
                      </div>
                    )}
                    {spotifyTrack && (
                      <div className='mt-4 flex flex-wrap gap-1.5'>
                        <Tag>{spotifyTrack.album.name}</Tag>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <Scrubber
                  current={currentTime}
                  duration={duration}
                  onSeek={onSeek}
                />

                {transport(true)}

                {queueList}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Desktop: side panel
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          role='dialog'
          aria-modal='false'
          aria-label='Now playing'
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{
            type: 'spring',
            damping: 32,
            stiffness: 300
          }}
          className='fixed inset-y-0 right-0 z-[61] flex w-[420px] flex-col border-l border-line bg-ink-950/95 shadow-[-40px_0_80px_-40px_rgb(0_0_0/0.9)] backdrop-blur-2xl'
          style={{
            backgroundImage: `radial-gradient(90% 40% at 50% 0%, ${accent}1f, transparent 70%)`
          }}
          ref={overlayRef}
        >
          <div className='flex h-(--nav-h) shrink-0 items-center justify-between border-b border-line px-6'>
            <span className='hud-label'>Now playing</span>
            <button
              ref={closeRef}
              type='button'
              onClick={onClose}
              aria-label='Close player'
              className='flex size-9 items-center justify-center rounded-lg text-bone-muted transition-colors hover:bg-white/[0.06] hover:text-bone'
            >
              <X className='size-[18px]' />
            </button>
          </div>

          <div className='flex-1 overflow-y-auto px-6 pt-6 pb-10'>
            <TrackArt
              track={selectedTrack as BeatTrack}
              className='w-full rounded-2xl shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]'
              sizes='372px'
              glow
              detail
              live
            />

            <div className='mt-6'>
              <div className='mb-3 flex items-center gap-2'>
                {sourceTag}
                {isPlaying && <EqBars />}
              </div>
              <h2 className='font-display-tight text-[1.75rem] text-bone'>
                {selectedTrack.title}
              </h2>
              <p className='mt-1.5 text-[15px] text-bone-muted'>{subtitle}</p>
            </div>

            <Scrubber
              current={currentTime}
              duration={duration}
              onSeek={onSeek}
              className='mt-6'
            />

            <div className='mt-4'>{transport(false)}</div>

            <div className='mt-6 flex items-center justify-center gap-3'>
              <button
                type='button'
                onClick={() => onVolumeChange(volume > 0 ? 0 : 80)}
                aria-label={volume > 0 ? 'Mute' : 'Unmute'}
                className='flex size-8 items-center justify-center rounded-full text-bone-dim transition-colors hover:text-bone'
              >
                {volume > 0 ? (
                  <Volume2 className='size-4' />
                ) : (
                  <VolumeX className='size-4' />
                )}
              </button>
              <ElasticSlider
                value={volume}
                onChange={onVolumeChange}
                maxValue={100}
                startingValue={0}
                className='w-52'
              />
            </div>

            {details.length > 0 && (
              <dl className='mt-8 grid grid-cols-2 overflow-hidden rounded-xl border border-line'>
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
                    <dd className='truncate text-sm font-medium text-bone'>
                      {d.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {beatTrack?.tags && beatTrack.tags.length > 0 && (
              <div className='mt-4 flex flex-wrap gap-1.5'>
                {beatTrack.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            )}

            {queueList && <div className='mt-8'>{queueList}</div>}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
