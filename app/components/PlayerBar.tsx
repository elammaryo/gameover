'use client'
import React from 'react'
import ElasticSlider from './ElasticSlider'
import { HiPlay, HiPause, HiBackward, HiForward } from 'react-icons/hi2'
import { Track } from '../models/Track'

type PlayerBarProps = {
  track?: Track
  isPlaying: boolean
  onNext?: () => void
  onPrev?: () => void
}

export function PlayerBar({
  track = {
    title: 'No track selected',
    source: 'beat',
    id: '',
    bpm: 0,
    genre: '',
    s3Key: '',
    artist: 'Select a beat to start'
  },
  onNext,
  onPrev
}: PlayerBarProps) {
  const [isPlaying, setIsPlaying] = React.useState(false)

  function onPlayPause() {
    setIsPlaying(!isPlaying)
  }
  return (
    <div className='fixed inset-x-0 bottom-0 z-40'>
      <audio
        controls
        onPlay={onPlayPause}
        onPause={onPlayPause}
        src='/audio.mp3'
      >
        Your browser does not support the audio element.
      </audio>
      <div className='px-4 pb-4'>
        <div className='flex w-full items-center gap-6 rounded-2xl border-t border-white/10 bg-[#05040A]/95 px-4 py-3 shadow-[0_-10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl'>
          {/* LEFT: cover + titles */}
          <div className='flex min-w-0 basis-[28%] items-center gap-3'>
            <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-500' />
            <div className='flex min-w-0 flex-col'>
              <span className='truncate text-sm font-semibold'>
                {track?.title}
              </span>
              <span className='truncate text-xs text-gray-400'>
                {track?.artist}
              </span>
            </div>
            {/* animated EQ – only when playing */}
            {isPlaying && (
              <div className='ml-1 flex h-4 items-end gap-[2px] text-cyan-300'>
                <span className='eq-bar-1 w-[2px] bg-cyan-300' />
                <span className='eq-bar-2 w-[2px] bg-cyan-300' />
                <span className='eq-bar-3 w-[2px] bg-cyan-300' />
              </div>
            )}
          </div>

          {/* CENTER: time + progress + controls (+ EQ) */}
          <div className='flex flex-1 items-center justify-center'>
            <div className='flex w-full max-w-[520px] flex-col items-center gap-2'>
              {/* controls + EQ */}
              <div className='flex items-center justify-center gap-2 pl-2'>
                <button
                  onClick={onPrev}
                  className='flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[10px] text-gray-200 hover:bg-white/10'
                >
                  <HiBackward size={14} />
                </button>
                <button
                  onClick={onPlayPause}
                  className='flex h-9 w-9 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black transition hover:scale-[1.05]'
                >
                  {isPlaying ? <HiPause size={18} /> : <HiPlay size={18} />}
                </button>
                <button
                  onClick={onNext}
                  className='flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[10px] text-gray-200 hover:bg-white/10'
                >
                  <HiForward size={14} />
                </button>
              </div>

              {/* time + progress */}
              <div className='flex w-full items-center gap-2'>
                <span className='text-[10px] text-gray-500'>0:00</span>
                <div className='relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/10'>
                  <div className='absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400' />
                </div>
                <span className='text-[10px] text-gray-500'>3:20</span>
              </div>
            </div>
          </div>

          {/* RIGHT: volume */}
          <div className='hidden basis-[22%] items-center justify-center gap-2 sm:flex'>
            <span className='mr-5 text-[10px] text-gray-500'>VOL</span>
            <ElasticSlider />
          </div>
        </div>
      </div>
    </div>
  )
}
