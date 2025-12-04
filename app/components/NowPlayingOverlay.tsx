'use client'
import { useContext, useState, useRef, useEffect } from 'react'
import { PlayBarContext } from '../providers/PlayBarProvider'
import Image from 'next/image'
import {
  HiPlay,
  HiPause,
  HiBackward,
  HiForward,
  HiXMark,
  HiChevronDown
} from 'react-icons/hi2'
import { BeatTrack, SpotifyTrack } from '../models/Track'
import ElasticSlider from './ElasticSlider'

interface NowPlayingOverlayProps {
  isOpen: boolean
  onClose: () => void
  currentTime: number
  duration: number
  volume: number
  onVolumeChange: (value: number) => void
  onSeek: (time: number) => void
  queue?: any[]
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
  const { selectedTrack, isPlaying, setPlayPause, onNext, onPrev } =
    useContext(PlayBarContext)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [dragY, setDragY] = useState(0)
  const overlayRef = useRef<HTMLDivElement>(null)

  const isMobile =
    typeof window !== 'undefined' ? window.innerWidth < 768 : false

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

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
    setDragY(e.targetTouches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
    const currentY = e.targetTouches[0].clientY
    const diff = currentY - dragY
    if (diff > 0 && isMobile) {
      // Only allow dragging down on mobile
      overlayRef.current?.style.setProperty(
        'transform',
        `translateY(${diff}px)`
      )
    }
  }

  const handleTouchEnd = () => {
    const currentY = parseFloat(
      overlayRef.current?.style.transform.match(/translateY\(([^)]+)\)/)?.[1] ||
        '0'
    )

    if (overlayRef.current) {
      overlayRef.current.style.setProperty('transform', 'translateY(0)')
    }

    // Swipe down to close (mobile) - threshold 100px
    if (currentY > 100) {
      onClose()
      return
    }

    // Swipe left/right to navigate
    const swipeDistance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (swipeDistance > minSwipeDistance) {
      // Swipe left - next track
      onNext()
    } else if (swipeDistance < -minSwipeDistance) {
      // Swipe right - previous track
      onPrev()
    }

    setTouchStart(0)
    setTouchEnd(0)
    setDragY(0)
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

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    onSeek(newTime)
  }

  if (!isOpen || !selectedTrack) return null

  const isBeat = selectedTrack.source === 'beat'
  const beatTrack = isBeat ? (selectedTrack as BeatTrack) : null
  const spotifyTrack = !isBeat ? (selectedTrack as SpotifyTrack) : null

  // Mobile: Full-screen overlay
  if (isMobile) {
    return (
      <>
        {/* Main overlay */}
        <div
          className='pt-safe fixed inset-0 z-[61] overflow-y-auto bg-gradient-to-b from-[#0a0810] via-[#05040A] to-black'
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          ref={overlayRef}
          style={{ transition: 'transform 0.2s ease-out' }}
        >
          {/* Swipe indicator */}
          <div className='flex justify-center pt-2 pb-4'>
            <div className='h-1 w-12 rounded-full bg-white/30' />
          </div>

          {/* Header */}
          <div className='flex items-center justify-between px-4 pb-4'>
            <button
              onClick={onClose}
              className='rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white'
            >
              <HiChevronDown size={24} />
            </button>
            <span className='font-mono text-xs tracking-[0.2em] text-gray-400 uppercase'>
              Now Playing
            </span>
            <button
              onClick={onClose}
              className='rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white'
            >
              <HiXMark size={24} />
            </button>
          </div>

          {/* Main Content */}
          <div className='flex flex-col items-center px-6 pb-32'>
            {/* Artwork */}
            <div className='w-full max-w-md'>
              {selectedTrack.artworkUrl ? (
                <div className='relative aspect-square w-full overflow-hidden rounded-3xl shadow-2xl shadow-cyan-500/20'>
                  <Image
                    src={selectedTrack.artworkUrl}
                    alt={selectedTrack.title}
                    fill
                    className='object-cover'
                  />
                </div>
              ) : (
                <div className='aspect-square w-full rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-fuchsia-500' />
              )}
            </div>

            {/* Track Info */}
            <div className='mt-8 w-full max-w-md'>
              <h1 className='text-3xl font-bold text-white'>
                {selectedTrack.title}
              </h1>
              <p className='mt-2 text-lg text-gray-400'>
                {selectedTrack.artist}
              </p>

              {/* Metadata */}
              {beatTrack && (
                <div className='mt-4 flex flex-wrap gap-2'>
                  <span className='rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300'>
                    {beatTrack.genre}
                  </span>
                  <span className='rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-gray-400'>
                    {beatTrack.bpm} BPM
                  </span>
                  {beatTrack.key && (
                    <span className='rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-gray-400'>
                      {beatTrack.key}
                    </span>
                  )}
                  {beatTrack.mood && (
                    <span className='rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-gray-400'>
                      {beatTrack.mood}
                    </span>
                  )}
                </div>
              )}

              {spotifyTrack && (
                <div className='mt-4 flex flex-wrap gap-2'>
                  <span className='rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-300'>
                    {spotifyTrack.album.name}
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className='mt-8 w-full max-w-md'>
              <div
                className='relative h-1 cursor-pointer overflow-hidden rounded-full bg-white/20'
                onClick={handleProgressClick}
              >
                <div
                  className='absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400'
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className='mt-2 flex justify-between text-xs text-gray-500'>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className='mt-8 flex w-full max-w-md items-center justify-center gap-8'>
              <button
                onClick={onPrev}
                disabled={!selectedTrack}
                className='rounded-full p-3 text-white transition-transform hover:scale-110 disabled:opacity-50'
              >
                <HiBackward size={32} />
              </button>
              <button
                onClick={handlePlayPause}
                disabled={!selectedTrack}
                className='flex h-20 w-20 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/20 transition-transform hover:scale-105 disabled:opacity-50'
              >
                {isPlaying ? <HiPause size={36} /> : <HiPlay size={36} />}
              </button>
              <button
                onClick={onNext}
                disabled={!selectedTrack}
                className='rounded-full p-3 text-white transition-transform hover:scale-110 disabled:opacity-50'
              >
                <HiForward size={32} />
              </button>
            </div>

            {/* Volume removed for mobile */}

            {/* Queue Preview */}
            {queue.length > 0 && (
              <div className='mt-12 w-full max-w-md'>
                <h3 className='mb-3 font-mono text-xs tracking-[0.2em] text-gray-400 uppercase'>
                  Next in Queue
                </h3>
                <div className='space-y-2'>
                  {queue.slice(0, 3).map(track => (
                    <div
                      key={track.id}
                      className='flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3'
                    >
                      {track.artworkUrl ? (
                        <Image
                          src={track.artworkUrl}
                          alt={track.title}
                          width={40}
                          height={40}
                          className='rounded-lg'
                        />
                      ) : (
                        <div className='h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-500' />
                      )}
                      <div className='flex-1 overflow-hidden'>
                        <p className='truncate text-sm font-semibold text-white'>
                          {track.title}
                        </p>
                        <p className='truncate text-xs text-gray-400'>
                          {track.artist}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // Desktop: Side panel with backdrop
  return (
    <>
      {/* Side panel */}
      <div
        className='fixed inset-y-0 right-0 z-30 w-[400px] border-l border-white/10 bg-[#05040A]/98 pb-20 shadow-2xl'
        ref={overlayRef}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-white/10 p-6'>
          <span className='font-mono text-xs tracking-[0.2em] text-gray-400 uppercase'>
            Now Playing
          </span>
          <button
            onClick={onClose}
            className='rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white'
          >
            <HiXMark size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='flex h-[calc(100vh-80px)] flex-col overflow-y-auto p-6'>
          {/* Artwork */}
          <div className='relative aspect-square w-full overflow-hidden rounded-2xl shadow-2xl shadow-cyan-500/20'>
            {selectedTrack.artworkUrl ? (
              <Image
                src={selectedTrack.artworkUrl}
                alt={selectedTrack.title}
                fill
                className='object-cover'
              />
            ) : (
              <div className='h-full w-full bg-gradient-to-br from-cyan-500 via-blue-500 to-fuchsia-500' />
            )}
          </div>

          {/* Track Info */}
          <div className='mt-6'>
            <h2 className='text-2xl font-bold text-white'>
              {selectedTrack.title}
            </h2>
            <p className='mt-1 text-lg text-gray-400'>{selectedTrack.artist}</p>
          </div>

          {/* Progress */}
          <div className='mt-6'>
            <div
              className='relative h-2 cursor-pointer overflow-hidden rounded-full bg-white/20'
              onClick={handleProgressClick}
            >
              <div
                className='absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400'
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className='mt-2 flex justify-between text-xs text-gray-500'>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className='mt-6 flex items-center justify-center gap-6'>
            <button
              onClick={onPrev}
              disabled={!selectedTrack}
              className='rounded-full p-2 text-white transition-transform hover:scale-110 disabled:opacity-50'
            >
              <HiBackward size={24} />
            </button>
            <button
              onClick={handlePlayPause}
              disabled={!selectedTrack}
              className='flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105 disabled:opacity-50'
            >
              {isPlaying ? <HiPause size={24} /> : <HiPlay size={24} />}
            </button>
            <button
              onClick={onNext}
              disabled={!selectedTrack}
              className='rounded-full p-2 text-white transition-transform hover:scale-110 disabled:opacity-50'
            >
              <HiForward size={24} />
            </button>
          </div>

          {/* Beat Metadata */}
          {beatTrack && (
            <div className='mt-6 space-y-4'>
              <div className='rounded-xl border border-white/10 bg-white/5 p-4'>
                <h3 className='mb-3 font-mono text-xs tracking-[0.2em] text-gray-400 uppercase'>
                  Details
                </h3>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-500'>Genre</span>
                    <span className='text-sm font-medium text-white'>
                      {beatTrack.genre}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-500'>BPM</span>
                    <span className='text-sm font-medium text-white'>
                      {beatTrack.bpm}
                    </span>
                  </div>
                  {beatTrack.key && (
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-500'>Key</span>
                      <span className='text-sm font-medium text-white'>
                        {beatTrack.key}
                      </span>
                    </div>
                  )}
                  {beatTrack.mood && (
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-500'>Mood</span>
                      <span className='text-sm font-medium text-white'>
                        {beatTrack.mood}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {beatTrack.tags && beatTrack.tags.length > 0 && (
                <div className='rounded-xl border border-white/10 bg-white/5 p-4'>
                  <h3 className='mb-3 font-mono text-xs tracking-[0.2em] text-gray-400 uppercase'>
                    Tags
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {beatTrack.tags.map((tag, index) => (
                      <span
                        key={index}
                        className='rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-gray-300'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Spotify Metadata */}
          {spotifyTrack && (
            <div className='mt-6 space-y-4'>
              <div className='rounded-xl border border-white/10 bg-white/5 p-4'>
                <h3 className='mb-3 font-mono text-xs tracking-[0.2em] text-gray-400 uppercase'>
                  Album
                </h3>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-500'>Name</span>
                    <span className='max-w-[200px] truncate text-right text-sm font-medium text-white'>
                      {spotifyTrack.album.name}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-500'>Artists</span>
                    <span className='max-w-[200px] truncate text-right text-sm font-medium text-white'>
                      {spotifyTrack.artists.map(a => a.name).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Queue */}
          {queue.length > 0 && (
            <div className='mt-6 pb-6'>
              <h3 className='mb-3 font-mono text-xs tracking-[0.2em] text-gray-400 uppercase'>
                Up Next
              </h3>
              <div className='space-y-2'>
                {queue.slice(0, 5).map(track => (
                  <div
                    key={track.id}
                    className='flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10'
                  >
                    {track.artworkUrl ? (
                      <Image
                        src={track.artworkUrl}
                        alt={track.title}
                        width={40}
                        height={40}
                        className='rounded-lg'
                      />
                    ) : (
                      <div className='h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-500' />
                    )}
                    <div className='flex-1 overflow-hidden'>
                      <p className='truncate text-sm font-semibold text-white'>
                        {track.title}
                      </p>
                      <p className='truncate text-xs text-gray-400'>
                        {track.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
