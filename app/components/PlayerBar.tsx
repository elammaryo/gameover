'use client'
import React, { useContext, useEffect, useRef, useState } from 'react'
import ElasticSlider from './ElasticSlider'
import { HiPlay, HiPause, HiBackward, HiForward } from 'react-icons/hi2'
import { PlayBarContext } from '../providers/PlayBarProvider'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export function PlayerBar() {
  const pathname = usePathname()
  if (pathname === '/studio') {
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(100)
    const audioRef = useRef<HTMLAudioElement>(null)
    const { selectedTrack, onNext, onPrev, isPlaying, setPlayPause } =
      useContext(PlayBarContext)
    const track = selectedTrack

    // Update audio element when track changes and auto-play
    useEffect(() => {
      if (audioRef.current && track?.audioUrl) {
        audioRef.current.load()
        // Auto-play when new track is loaded
        audioRef.current
          .play()
          .then(() => {
            setPlayPause(true)
          })
          .catch(err => {
            console.error('Auto-play error:', err)
          })
      }
    }, [track?.audioUrl])

    // Play/pause audio when isPlaying changes
    useEffect(() => {
      if (!audioRef.current) return

      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Play error:', err)
          setPlayPause(false)
        })
      } else {
        audioRef.current.pause()
      }
    }, [isPlaying])

    // Update volume when it changes
    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.volume = volume / 100
      }
    }, [volume])

    function onPlayPause() {
      setPlayPause(!isPlaying)
    }

    function handleTimeUpdate() {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }

    function handleLoadedMetadata() {
      if (audioRef.current) {
        setDuration(audioRef.current.duration)
      }
    }

    function handleEnded() {
      onNext()
    }

    function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
      if (!audioRef.current) return
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      const newTime = percent * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }

    function formatTime(seconds: number) {
      if (isNaN(seconds)) return '0:00'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
      <div className='fixed inset-x-0 bottom-0 z-40'>
        {track?.audioUrl && (
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onPlay={() => setPlayPause(true)}
            onPause={() => setPlayPause(false)}
            onError={e => console.error('Audio error event:', e)}
            src={track.audioUrl}
          />
        )}
        <div className='px-0 pb-0'>
          <div className='flex w-full items-center gap-6 rounded-2xl border-t border-white/10 bg-[#05040A]/95 px-4 py-4 text-white shadow-[0_-10px_35px_rgba(0,0,0,0.6)] max-sm:pb-8'>
            {/* LEFT: cover + titles */}
            <div className='flex min-w-0 items-center gap-3'>
              {track?.artworkUrl ? (
                <Image
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
                    disabled={!track?.audioUrl}
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
            <div className='hidden basis-[22%] items-center justify-center gap-2 sm:flex'>
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
    )
  }
}
