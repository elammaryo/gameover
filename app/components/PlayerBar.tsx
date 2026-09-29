'use client'
import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  Maximize2,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX
} from 'lucide-react'
import ElasticSlider from './ElasticSlider'
import { PlayBarContext } from '../providers/PlayBarProvider'
import { NowPlayingOverlay } from './NowPlayingOverlay'
import { TrackArt } from './Covers'
import { Scrubber } from './Scrubber'
import { EqBars, PlayButton } from './ui'
import { prettySubtitle } from '@/lib/beats'
import type { BeatTrack, Track } from '../models/Track'
import { cn } from '@/lib/utils'

function useIsMobile() {
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

export function trackSubline(track: Track | null) {
  if (!track) return ''
  if (track.source === 'beat') {
    const beat = track as BeatTrack
    const lead = prettySubtitle(beat.subtitle) ?? beat.genre
    return [lead, beat.bpm ? `${beat.bpm} BPM` : null]
      .filter(Boolean)
      .join(' · ')
  }
  return track.artist ?? ''
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return (
    el.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName) ||
    el.getAttribute('role') === 'slider'
  )
}

export function PlayerBar() {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [muted, setMuted] = useState(false)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const spotifyProgressInterval = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)

  const { selectedTrack, onNext, onPrev, isPlaying, setPlayPause, queue } =
    useContext(PlayBarContext)
  const track = selectedTrack
  const shouldShowPlayer = !!selectedTrack
  const isMobile = useIsMobile()
  const effectiveVolume = muted ? 0 : volume

  // playback state updates
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }
  }, [isPlaying])

  // position state for beats
  useEffect(() => {
    if (
      track?.source === 'beat' &&
      'mediaSession' in navigator &&
      duration > 0
    ) {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: Math.max(0, Math.min(currentTime, duration))
      })
    }
  }, [currentTime, duration, track?.source])

  useEffect(() => {
    if (
      !track ||
      typeof navigator === 'undefined' ||
      !('mediaSession' in navigator)
    ) {
      return
    }
    if (track.source === 'beat') {
      // Set metadata for native media controls
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'Unknown Track',
        artist: track.artist || 'Unknown Artist',
        album: 'GameOver Studio',
        artwork: [
          {
            src: track.artworkUrl || '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      })
    }

    navigator.mediaSession.setActionHandler('play', () => {
      setPlayPause(true)
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      setPlayPause(false)
    })

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      onNext()
    })

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      onPrev()
    })

    // Disable seek buttons
    navigator.mediaSession.setActionHandler('seekbackward', null)
    navigator.mediaSession.setActionHandler('seekforward', null)

    navigator.mediaSession.setActionHandler('seekto', details => {
      if (details.seekTime !== undefined) {
        const audio = audioRef.current
        if (audio && track.source === 'beat') {
          audio.currentTime = details.seekTime
          setCurrentTime(details.seekTime)
        } else if (track.source === 'spotify' && window.spotifyPlayerInstance) {
          window.spotifyPlayerInstance.seek(details.seekTime * 1000)
        }
      }
    })

    // Cleanup
    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null
        navigator.mediaSession.setActionHandler('play', null)
        navigator.mediaSession.setActionHandler('pause', null)
        navigator.mediaSession.setActionHandler('nexttrack', null)
        navigator.mediaSession.setActionHandler('previoustrack', null)
        navigator.mediaSession.setActionHandler('seekto', null)
      }
    }
  }, [track, setPlayPause, onNext, onPrev])

  // Handle Spotify progress
  useEffect(() => {
    if (selectedTrack?.source === 'spotify' && window.spotifyPlayerInstance) {
      if (spotifyProgressInterval.current) {
        clearInterval(spotifyProgressInterval.current)
      }

      if (selectedTrack.duration_ms) {
        setDuration(selectedTrack.duration_ms / 1000)
      }

      spotifyProgressInterval.current = setInterval(async () => {
        const state = await window.spotifyPlayerInstance?.getCurrentState()
        if (state) {
          const position = state.position / 1000
          const dur = state.duration / 1000

          setCurrentTime(position)
          setDuration(dur)

          // Spotify position state
          if ('mediaSession' in navigator && dur > 0) {
            navigator.mediaSession.setPositionState({
              duration: dur,
              playbackRate: 1,
              position: Math.max(0, Math.min(position, dur))
            })
          }
        }
      }, 1000)
      return () => {
        if (spotifyProgressInterval.current) {
          clearInterval(spotifyProgressInterval.current)
        }
      }
    } else {
      if (spotifyProgressInterval.current) {
        clearInterval(spotifyProgressInterval.current)
        spotifyProgressInterval.current = null
      }
    }
  }, [selectedTrack?.source, selectedTrack?.id])

  // Update audio on track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!track?.audioUrl || track?.source !== 'beat') {
      audio.pause()
      audio.src = ''
      isLoadingRef.current = false
      return
    }

    // Prevent loading if already loading
    if (isLoadingRef.current) return

    isLoadingRef.current = true
    setCurrentTime(0)

    const handleCanPlay = () => {
      isLoadingRef.current = false
      audio
        .play()
        .then(() => {
          setPlayPause(true)
        })
        .catch(err => {
          console.error('Auto-play error:', err)
          setPlayPause(false)
        })
    }

    const handleError = () => {
      isLoadingRef.current = false
      console.error('Audio load error')
      setPlayPause(false)
    }

    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    audio.load()

    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [track?.audioUrl, track?.id])

  // Play/pause control
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || selectedTrack?.source !== 'beat') return

    if (isPlaying) {
      audio.play().catch(err => {
        console.error('Play error:', err)
        setPlayPause(false)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, selectedTrack?.source])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = effectiveVolume / 100
    }

    if (window.spotifyPlayerInstance) {
      window.spotifyPlayerInstance.setVolume(effectiveVolume / 100)
    }
  }, [effectiveVolume, track?.id])

  // Space toggles playback anywhere on the site (unless you're typing)
  useEffect(() => {
    if (!selectedTrack) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || isTypingTarget(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      setPlayPause(!isPlaying)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedTrack, isPlaying, setPlayPause])

  function handleTimeUpdate() {
    if (audioRef.current && selectedTrack?.source === 'beat') {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  function handleLoadedMetadata() {
    if (audioRef.current && selectedTrack?.source === 'beat') {
      setDuration(audioRef.current.duration)
    }
  }

  function handleEnded() {
    onNext()
  }

  function seekTo(time: number) {
    if (window.spotifyPlayerInstance && selectedTrack?.source === 'spotify') {
      window.spotifyPlayerInstance.seek(time * 1000) // Convert to ms
      setCurrentTime(time)
      return
    }

    if (!audioRef.current) return
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  function changeVolume(value: number) {
    setVolume(value)
    if (muted && value > 0) setMuted(false)
  }

  // Tapping the dock (outside its buttons) opens Now Playing on mobile
  const handlePlayerBarClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('[role="slider"]') ||
      target.closest('[data-volume-slider]')
    ) {
      return
    }

    if (isMobile && track) {
      setIsOverlayOpen(true)
    }
  }

  const VolumeIcon =
    effectiveVolume === 0 ? VolumeX : effectiveVolume < 50 ? Volume1 : Volume2
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!shouldShowPlayer) return null

  return (
    <>
      <NowPlayingOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        currentTime={currentTime}
        duration={duration}
        volume={effectiveVolume}
        onVolumeChange={changeVolume}
        onSeek={seekTo}
        queue={queue}
      />

      {track?.source === 'beat' && track?.audioUrl && (
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          src={track.audioUrl}
        />
      )}

      <div className='pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 pb-[calc(0.5rem+var(--safe-area-inset-bottom))] sm:px-4 sm:pb-4'>
        <section
          aria-label='Player'
          onClick={handlePlayerBarClick}
          className='surface-raised pointer-events-auto relative mx-auto max-w-[1240px] overflow-hidden rounded-2xl bg-ink-900/85! backdrop-blur-2xl backdrop-saturate-150'
        >
          {/* mobile: progress along the bottom edge */}
          <div className='absolute inset-x-3 bottom-0 h-[2px] overflow-hidden rounded-full bg-white/8 sm:hidden'>
            <div
              className='h-full bg-live shadow-[0_0_8px_rgb(59_231_255/0.8)]'
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className='grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 sm:h-[78px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] sm:gap-6 sm:px-3'>
            {/* LEFT: artwork + titles, opens Now Playing */}
            <button
              type='button'
              data-shot='open-now-playing'
              onClick={e => {
                e.stopPropagation()
                if (track) setIsOverlayOpen(true)
              }}
              className='group/np flex min-w-0 items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white/[0.04]'
              aria-label={`Now playing: ${track?.title}. Open player`}
            >
              {track && (
                <TrackArt
                  track={track as BeatTrack}
                  className='size-11 rounded-lg sm:size-12'
                />
              )}
              <span className='flex min-w-0 flex-col gap-0.5'>
                <span className='flex min-w-0 items-center gap-2'>
                  <span className='truncate text-sm font-semibold text-bone'>
                    {track?.title}
                  </span>
                  {isPlaying && <EqBars className='hidden sm:inline-flex' />}
                </span>
                <span className='truncate text-xs text-bone-dim'>
                  {trackSubline(track)}
                </span>
              </span>
            </button>

            {/* CENTER: transport + seek (desktop) */}
            <div className='hidden min-w-0 flex-col items-center gap-1.5 sm:flex'>
              <div className='flex items-center gap-3'>
                <button
                  type='button'
                  onClick={e => {
                    e.stopPropagation()
                    onPrev()
                  }}
                  disabled={!track}
                  aria-label='Previous track'
                  className='flex size-9 items-center justify-center rounded-full text-bone-muted transition-colors hover:bg-white/[0.06] hover:text-bone disabled:opacity-40'
                >
                  <SkipBack className='size-4' fill='currentColor' />
                </button>
                <PlayButton
                  tone='bone'
                  size='md'
                  playing={isPlaying}
                  label={isPlaying ? 'Pause' : 'Play'}
                  disabled={!track?.id}
                  onClick={e => {
                    e.stopPropagation()
                    setPlayPause(!isPlaying)
                  }}
                />
                <button
                  type='button'
                  onClick={e => {
                    e.stopPropagation()
                    onNext()
                  }}
                  disabled={!track}
                  aria-label='Next track'
                  className='flex size-9 items-center justify-center rounded-full text-bone-muted transition-colors hover:bg-white/[0.06] hover:text-bone disabled:opacity-40'
                >
                  <SkipForward className='size-4' fill='currentColor' />
                </button>
              </div>
              <Scrubber
                current={currentTime}
                duration={duration}
                onSeek={seekTo}
                size='sm'
                className='max-w-[520px]'
              />
            </div>

            {/* RIGHT: volume + expand (desktop) */}
            <div
              className='hidden items-center justify-end gap-1 sm:flex'
              onClick={e => e.stopPropagation()}
            >
              <button
                type='button'
                onClick={() => setMuted(m => !m)}
                aria-label={muted ? 'Unmute' : 'Mute'}
                aria-pressed={muted}
                className='flex size-9 items-center justify-center rounded-full text-bone-muted transition-colors hover:bg-white/[0.06] hover:text-bone'
              >
                <VolumeIcon className='size-[18px]' />
              </button>
              <div data-volume-slider className='hidden lg:block'>
                <ElasticSlider
                  value={effectiveVolume}
                  onChange={changeVolume}
                  maxValue={100}
                  startingValue={0}
                  className='w-32'
                />
              </div>
              <button
                type='button'
                onClick={() => setIsOverlayOpen(true)}
                aria-label='Open Now Playing and queue'
                className='ml-1 flex size-9 items-center justify-center rounded-full text-bone-muted transition-colors hover:bg-white/[0.06] hover:text-bone'
              >
                <Maximize2 className='size-4' />
              </button>
            </div>

            {/* MOBILE: play + next */}
            <div className='flex items-center gap-1 pr-1 sm:hidden'>
              <PlayButton
                tone='bone'
                size='md'
                playing={isPlaying}
                label={isPlaying ? 'Pause' : 'Play'}
                disabled={!track?.id}
                onClick={e => {
                  e.stopPropagation()
                  setPlayPause(!isPlaying)
                }}
              />
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation()
                  onNext()
                }}
                disabled={!track}
                aria-label='Next track'
                className='flex size-10 items-center justify-center rounded-full text-bone transition-colors active:bg-white/10 disabled:opacity-40'
              >
                <SkipForward className='size-[18px]' fill='currentColor' />
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

/** Keeps page content from ending up underneath the player dock. */
export function PlayerSpacer() {
  const { selectedTrack } = useContext(PlayBarContext)
  return (
    <div
      aria-hidden
      className={cn(
        'transition-[height] duration-300',
        selectedTrack ? 'h-24 sm:h-28' : 'h-0'
      )}
    />
  )
}
