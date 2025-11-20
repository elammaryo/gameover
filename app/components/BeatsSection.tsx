import { HiPlay } from 'react-icons/hi2'
import { BeatTrack } from '../models/Track'

export function BeatsSection({ beats }: { beats: BeatTrack[] }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {beats.map(beat => (
        <div
          key={beat.id}
          className='group flex cursor-pointer flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-cyan-400/60 hover:bg-white/10'
        >
          <div className='flex items-center justify-between gap-2'>
            <div className='flex flex-col gap-1'>
              <span className='text-sm font-semibold'>{beat.title}</span>
              <span className='text-xs text-gray-400'>
                {beat.genre} · {beat.bpm} BPM · {beat.mood || 'Unknown'}
              </span>
            </div>
            <button
              className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-xs font-semibold text-black transition-transform group-hover:scale-105'
              onClick={() => {
                // use provider to set selected track
                // setSelectedTrack(beat)
              }}
            >
              <HiPlay size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
