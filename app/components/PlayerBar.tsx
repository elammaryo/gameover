'use client'
import React, { useContext, useEffect, useRef, useState } from 'react'
import ElasticSlider from './ElasticSlider'
import { HiPlay, HiPause, HiBackward, HiForward } from 'react-icons/hi2'
import { HiVolumeUp } from 'react-icons/hi'
import { PlayBarContext } from '../providers/PlayBarProvider'
import Image from 'next/image'
import { NowPlayingOverlay } from './NowPlayingOverlay'

export function PlayerBar() {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const spotifyProgressInterval = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)

  const { selectedTrack, onNext, onPrev, isPlaying, setPlayPause, queue } =
    useContext(PlayBarContext)
  const track = selectedTrack
  const shouldShowPlayer = !!selectedTrack

  const isMobile =
    typeof window !== 'undefined' ? window.innerWidth < 768 : false

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
            src: track.artworkUrl || '',
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
      audioRef.current.volume = volume / 100
    }

    if (window.spotifyPlayerInstance) {
      window.spotifyPlayerInstance.setVolume(volume / 100)
    }
  }, [volume])

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

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration

    if (window.spotifyPlayerInstance && selectedTrack?.source === 'spotify') {
      window.spotifyPlayerInstance.seek(newTime * 1000) // Convert to ms
      setCurrentTime(newTime)
      return
    }

    if (!audioRef.current) return
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  function handleSeekFromOverlay(time: number) {
    if (window.spotifyPlayerInstance && selectedTrack?.source === 'spotify') {
      window.spotifyPlayerInstance.seek(time * 1000) // Convert to ms
      setCurrentTime(time)
      return
    }

    if (!audioRef.current) return
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  // Handle PlayerBar click on mobile
  const handlePlayerBarClick = (e: React.MouseEvent) => {
    // Don't open on button clicks
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[data-volume-slider]')
    ) {
      return
    }

    if (isMobile && track) {
      setIsOverlayOpen(true)
    }
  }

  function formatTime(seconds: number) {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  if (shouldShowPlayer) {
    return (
      <>
        <NowPlayingOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          onVolumeChange={setVolume}
          onSeek={handleSeekFromOverlay}
          queue={queue}
        />

        <div className='fixed inset-x-0 bottom-0 z-40'>
          {track?.source === 'beat' && track?.audioUrl && (
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              src={track.audioUrl}
            />
          )}
          <div className='pb-safe mb-safe px-0'>
            <div
              onClick={handlePlayerBarClick}
              className={`relative flex w-full items-center justify-between gap-6 rounded-2xl border-t border-white/10 bg-[#05040A]/95 px-4 py-4 text-white shadow-[0_-10px_35px_rgba(0,0,0,0.6)] transition-colors max-sm:pb-8 sm:py-8 md:cursor-default`}
            >
              {/* LEFT: cover + titles */}
              <div
                className={`flex min-w-0 flex-1 items-center gap-3 sm:w-[30%] sm:flex-none ${
                  !isMobile && track ? 'md:cursor-pointer' : ''
                }`}
                onClick={
                  !isMobile
                    ? e => {
                        e.stopPropagation()
                        if (track) setIsOverlayOpen(true)
                      }
                    : undefined
                }
              >
                {track?.artworkUrl ? (
                  <Image
                    width={100}
                    height={100}
                    src={track.artworkUrl}
                    alt={track.title ?? 'Track Artwork'}
                    className='h-10 w-10 flex-shrink-0 rounded-xl'
                  />
                ) : (
                  <div className='h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-500' />
                )}
                <div className='flex min-w-0 flex-col'>
                  <span className='truncate text-sm font-semibold'>
                    {track?.title || 'No track selected'}
                  </span>
                  <span className='truncate text-xs text-gray-400'>
                    {track?.artist || 'Select a beat to start'}
                  </span>
                </div>
                {isPlaying && (
                  <div className='ml-1 hidden h-4 flex-shrink-0 items-end gap-[2px] text-cyan-300 sm:flex'>
                    <span className='eq-bar-1 w-[2px] bg-cyan-300' />
                    <span className='eq-bar-2 w-[2px] bg-cyan-300' />
                    <span className='eq-bar-3 w-[2px] bg-cyan-300' />
                  </div>
                )}
              </div>

              {/* CENTER: time + progress + controls - DESKTOP ONLY */}
              <div className='pointer-events-none absolute left-1/2 hidden -translate-x-1/2 sm:block'>
                <div className='pointer-events-auto flex flex-col items-center gap-2'>
                  <div className='flex items-center justify-center gap-2'>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onPrev()
                      }}
                      disabled={!track}
                      className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-[10px] text-gray-200 hover:bg-white/10 disabled:opacity-50'
                    >
                      <HiBackward size={14} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setPlayPause(!isPlaying)
                      }}
                      disabled={!track?.id}
                      className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black transition hover:scale-[1.05] disabled:opacity-50'
                    >
                      {isPlaying ? <HiPause size={18} /> : <HiPlay size={18} />}
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onNext()
                      }}
                      disabled={!track}
                      className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-[10px] text-gray-200 hover:bg-white/10 disabled:opacity-50'
                    >
                      <HiForward size={14} />
                    </button>
                  </div>

                  <div className='flex w-[30vw] items-center gap-2'>
                    <span className='text-[10px] text-gray-500'>
                      {formatTime(currentTime)}
                    </span>
                    <div
                      data-progress-bar
                      className='relative h-[5px] flex-1 cursor-pointer overflow-hidden rounded-full bg-white/10'
                      onClick={e => {
                        e.stopPropagation()
                        handleSeek(e)
                      }}
                    >
                      <div
                        className='absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 transition-all'
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className='text-[10px] text-gray-500'>
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile controls */}
              <div className='flex flex-1 items-center justify-end gap-2 sm:hidden'>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onPrev()
                  }}
                  disabled={!track}
                  className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-[10px] text-gray-200 hover:bg-white/10 disabled:opacity-50'
                >
                  <HiBackward size={14} />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setPlayPause(!isPlaying)
                  }}
                  disabled={!track?.id}
                  className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black transition hover:scale-[1.05] disabled:opacity-50'
                >
                  {isPlaying ? <HiPause size={18} /> : <HiPlay size={18} />}
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onNext()
                  }}
                  disabled={!track}
                  className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-[10px] text-gray-200 hover:bg-white/10 disabled:opacity-50'
                >
                  <HiForward size={14} />
                </button>
              </div>

              {/* RIGHT: volume - DESKTOP ONLY */}
              <div
                data-volume-slider
                className='mr-10 hidden w-[30%] items-center justify-end gap-2 sm:flex'
                onClick={e => e.stopPropagation()}
              >
                <HiVolumeUp size={20} className='mr-6 text-gray-400' />
                <ElasticSlider
                  value={volume}
                  onChange={val => setVolume(val)}
                  maxValue={100}
                  startingValue={0}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
  return null
}
