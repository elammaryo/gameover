'use client'
import React, { useContext, useEffect, useRef, useState } from 'react'
import ElasticSlider from './ElasticSlider'
import { HiPlay, HiPause, HiBackward, HiForward } from 'react-icons/hi2'
import { PlayBarContext } from '../providers/PlayBarProvider'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { NowPlayingOverlay } from './NowPlayingOverlay'

export function PlayerBar() {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const spotifyProgressInterval = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)

  const { selectedTrack, onNext, onPrev, isPlaying, setPlayPause } =
    useContext(PlayBarContext)
  const track = selectedTrack

  // Only show PlayerBar on studio and spotify pages
  const shouldShowPlayer = pathname !== '/'

  // ✅ Handle Spotify progress
  useEffect(() => {
    if (selectedTrack?.source === 'spotify' && window.spotifyPlayerInstance) {
      if (spotifyProgressInterval.current) {
        clearInterval(spotifyProgressInterval.current)
      }

      if (selectedTrack.durationMs) {
        setDuration(selectedTrack.durationMs / 1000)
      }

      spotifyProgressInterval.current = setInterval(async () => {
        const state = await window.spotifyPlayerInstance?.getCurrentState()
        if (state) {
          setCurrentTime(state.position / 1000)
          setDuration(state.duration / 1000)
        }
      }, 100)

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

  // ✅ Update audio element when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track?.audioUrl || track?.source !== 'beat') return

    // Prevent loading if already loading
    if (isLoadingRef.current) return

    isLoadingRef.current = true

    // Reset current time when changing tracks
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

    // Load the new track
    audio.load()

    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [track?.audioUrl, track?.id])

  // ✅ Play/pause control
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || selectedTrack?.source !== 'beat') return

    if (isPlaying) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Play error:', err)
          setPlayPause(false)
        })
      }
    } else {
      audio.pause()
    }
  }, [isPlaying, selectedTrack?.source])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }

    if (window.spotifyPlayerInstance) {
      window.spotifyPlayerInstance.setVolume(volume / 100)
    }
  }, [volume])

  function onPlayPause() {
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

  const handlePlayerBarClick = (e: React.MouseEvent) => {
    // Don't open overlay if clicking on interactive elements
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('[data-progress-bar]') ||
      target.closest('[data-volume-slider]')
    ) {
      return
    }
    setIsOverlayOpen(true)
  }

  const handleArtworkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOverlayOpen(true)
  }

  function formatTime(seconds: number) {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Hide the player UI on pages other than studio/spotify, but keep the component mounted
  if (!shouldShowPlayer) {
    return (
      <>
        {/* Keep audio element alive even when UI is hidden */}
        {track?.source === 'beat' && track?.audioUrl && (
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            src={track.audioUrl}
          />
        )}
      </>
    )
  }

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
        <div className='px-0 pb-0'>
          <div
            className='flex w-full items-center gap-6 rounded-2xl border-t border-white/10 bg-[#05040A]/95 px-4 py-4 text-white shadow-[0_-10px_35px_rgba(0,0,0,0.6)] max-sm:pb-8 md:cursor-default'
            onClick={handlePlayerBarClick}
          >
            {/* LEFT: cover + titles */}
            <div
              className='flex min-w-0 items-center gap-3 md:cursor-pointer'
              onClick={handleArtworkClick}
            >
              {track?.artworkUrl ? (
                <Image
                  width={100}
                  height={100}
                  src={track.artworkUrl}
                  alt={track.title}
                  className='h-10 w-10 rounded-xl'
                />
              ) : (
                <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-500' />
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
                <div className='ml-1 flex h-4 items-end gap-[2px] text-cyan-300'>
                  <span className='eq-bar-1 w-[2px] bg-cyan-300' />
                  <span className='eq-bar-2 w-[2px] bg-cyan-300' />
                  <span className='eq-bar-3 w-[2px] bg-cyan-300' />
                </div>
              )}
            </div>

            {/* CENTER: time + progress + controls */}
            <div className='flex flex-1 items-center justify-center'>
              <div className='flex w-full max-w-[520px] flex-col items-end gap-2 sm:items-center'>
                <div className='flex items-center justify-center gap-2 pl-2'>
                  <button
                    onClick={onPrev}
                    disabled={!track}
                    className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-[10px] text-gray-200 hover:bg-white/10 disabled:opacity-50'
                  >
                    <HiBackward size={14} />
                  </button>
                  <button
                    onClick={onPlayPause}
                    disabled={!track?.id}
                    className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black transition hover:scale-[1.05] disabled:opacity-50'
                  >
                    {isPlaying ? <HiPause size={18} /> : <HiPlay size={18} />}
                  </button>
                  <button
                    onClick={onNext}
                    disabled={!track}
                    className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-[10px] text-gray-200 hover:bg-white/10 disabled:opacity-50'
                  >
                    <HiForward size={14} />
                  </button>
                </div>

                <div className='flex w-full items-center gap-2 max-sm:hidden'>
                  <span className='text-[10px] text-gray-500'>
                    {formatTime(currentTime)}
                  </span>
                  <div
                    data-progress-bar
                    className='relative h-[5px] flex-1 cursor-pointer overflow-hidden rounded-full bg-white/10'
                    onClick={handleSeek}
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

            {/* RIGHT: volume */}
            <div
              data-volume-slider
              className='hidden basis-[22%] items-center justify-center gap-2 sm:flex'
            >
              <span className='mr-5 text-[10px] text-gray-500'>VOL</span>
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
