import ElectricBorder from '../components/ElectricBorder'
import { HiPause, HiPlay } from 'react-icons/hi2'
import { BeatTrack, Track } from '../models/Track'
import { useContext } from 'react'
import { PlayBarContext } from '../providers/PlayBarProvider'

function FeaturedBeatsSection({
  featuredBeats,
  allBeats
}: {
  featuredBeats: BeatTrack[]
  allBeats: Track[]
}) {
  const { isPlaying, setPlayPause, selectedTrack, setTrack, setQueue } =
    useContext(PlayBarContext)
  const isMobile =
    typeof window !== 'undefined' ? window.innerWidth < 768 : false

  const handlePlay = async (track: BeatTrack) => {
    if (selectedTrack?.id === track.id && isPlaying) {
      setPlayPause(false)
    } else if (selectedTrack?.id === track.id && !isPlaying) {
      setPlayPause(true)
    } else {
      await setTrack(track)
      const queue: Track[] = [track, ...allBeats.filter(b => b.id !== track.id)]
      setQueue(queue)
    }
  }

  const getGradient = (index: number) => {
    const gradients = [
      'from-cyan-500 via-blue-500 to-purple-600',
      'from-fuchsia-500 via-pink-500 to-rose-600',
      'from-orange-500 via-amber-500 to-yellow-500',
      'from-green-500 via-emerald-500 to-teal-600',
      'from-violet-500 via-purple-500 to-fuchsia-600'
    ]
    return gradients[index % gradients.length]
  }

  const displayBeats = featuredBeats.slice(0, isMobile ? 3 : 6)

  return (
    <section className='space-y-6'>
      <div className='flex items-center gap-2'>
        <span className='text-cyan-400'>⚡</span>
        <h2 className='font-mono font-medium tracking-[0.22em] text-white uppercase'>
          Featured Beats
        </h2>
      </div>

      {/* Asymmetric Grid Layout */}
      <div className='grid auto-rows-[240px] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {displayBeats.map((track, index) => {
          const isCurrentTrack = selectedTrack?.id === track.id
          const isTrackPlaying = isCurrentTrack && isPlaying

          // First track takes full width on desktop
          const isHero = index === 0
          const gridClass = isHero ? 'md:col-span-2 md:row-span-2' : ''

          const card = (
            <div
              onClick={() => handlePlay(track)}
              className='group relative flex h-full min-h-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl bg-[#0C0A11]/80 p-6 backdrop-blur-xl transition-all hover:scale-[1.02]'
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${getGradient(index)} opacity-20 transition-opacity group-hover:opacity-30`}
              />

              {/* Content */}
              <div className='relative z-10 flex h-full min-h-0 flex-col justify-between'>
                {/* Top section */}
                <div>
                  {/* Genre tag */}
                  <span className='inline-block rounded-full border border-cyan-400/50 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300'>
                    {track.genre}
                  </span>

                  {/* Now playing indicator */}
                  {isCurrentTrack && (
                    <div className='mt-2 flex items-center gap-2'>
                      <div className='h-2 w-2 animate-pulse rounded-full bg-green-400' />
                      <span className='text-xs font-medium text-green-400'>
                        {isPlaying ? 'NOW PLAYING' : 'PAUSED'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom section */}
                <div className='min-h-0'>
                  <h3
                    className={`line-clamp-2 leading-tight font-bold text-white ${
                      isHero ? 'text-xl md:text-3xl lg:text-4xl' : 'text-xl'
                    }`}
                  >
                    {track.title}
                  </h3>
                  <p
                    className={`mt-1 text-gray-400 ${
                      isHero ? 'text-sm md:text-base lg:text-lg' : 'text-sm'
                    }`}
                  >
                    {track.artist}
                  </p>

                  {/* Metadata */}
                  <div className='mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500'>
                    <span>{track.bpm} BPM</span>
                    {track.key && <span>· {track.key}</span>}
                    {track.mood && <span>· {track.mood}</span>}
                  </div>

                  {/* Play button */}
                  <div className='mt-3 flex items-center gap-3'>
                    <button
                      className={`flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-110 hover:shadow-cyan-500/50 ${
                        isHero ? 'h-14 w-14' : 'h-12 w-12'
                      }`}
                      onClick={e => {
                        e.stopPropagation()
                        handlePlay(track)
                      }}
                    >
                      {isTrackPlaying ? (
                        <HiPause size={isHero ? 24 : 20} />
                      ) : (
                        <HiPlay size={isHero ? 24 : 20} />
                      )}
                    </button>
                    {isHero && (
                      <span className='text-sm font-medium text-white'>
                        {isTrackPlaying ? 'Pause' : 'Play Now'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hover overlay */}
              <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
            </div>
          )

          return (
            <div key={track.id} className={gridClass}>
              {card}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default FeaturedBeatsSection
