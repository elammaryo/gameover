import ElectricBorder from '../components/ElectricBorder'
import { HiPause, HiPlay } from 'react-icons/hi2'
import { BeatTrack, Track } from '../models/Track'
import { useContext } from 'react'
import { PlayBarContext } from '../providers/PlayBarProvider'

function FeaturedBeatCard({
  track,
  beats
}: {
  track: BeatTrack | null
  beats: Track[]
}) {
  const { isPlaying, setPlayPause, selectedTrack, setTrack, setQueue } =
    useContext(PlayBarContext)
  const isMobile =
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  const card = (
    <div className='rounded-[20px] bg-[#0C0A11]/80 p-6 backdrop-blur-xl'>
      <span className='text-xs tracking-[0.22em] text-cyan-300 uppercase'>
        ⚡ Featured Beat
      </span>

      <div className='mt-3 flex items-center gap-4'>
        {/* Placeholder cover art */}
        <div className='h-20 w-20 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 shadow-lg shadow-cyan-500/30' />

        <div className='flex flex-col'>
          <h3 className='text-xl font-semibold'>{track?.title}</h3>
          <p className='text-sm text-gray-400'>
            {track?.genre} · {track?.bpm} · {track?.mood}
          </p>
        </div>

        <button
          className='ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[14px] font-semibold text-black transition hover:scale-105'
          onClick={async () => {
            if (selectedTrack?.id === track?.id && isPlaying) {
              setPlayPause(!isPlaying)
            } else if (selectedTrack?.id === track?.id && !isPlaying) {
              setPlayPause(!isPlaying)
            } else {
              await setTrack(track)
              const queue: Track[] =
                track != null ? [track, ...beats] : [...beats]
              setQueue(queue)
            }
          }}
        >
          {selectedTrack?.id === track?.id && isPlaying ? (
            <HiPause size={20} />
          ) : (
            <HiPlay size={20} />
          )}
        </button>
      </div>
    </div>
  )
  return isMobile ? (
    <div className='rounded-[20px] border-2 border-cyan-400 shadow-lg shadow-cyan-400/50'>
      {card}
    </div>
  ) : (
    <ElectricBorder
      color='#00eaff'
      speed={0.4}
      chaos={0.3}
      thickness={2}
      style={{ borderRadius: 20 }}
    >
      {card}
    </ElectricBorder>
  )
}

export default FeaturedBeatCard
