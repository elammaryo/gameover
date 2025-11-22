import { HiPlay } from 'react-icons/hi2'
import { Playlist } from '../models/Playlist'

export function PlaylistsSection({ playlists }: { playlists: Playlist[] }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {playlists.map(playlist => (
        <button
          key={playlist.id}
          className='bg-white/5/5 flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/5 p-5 transition-colors hover:border-fuchsia-400/60 hover:bg-white/10'
          onClick={() => {}}
        >
          <div className='h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500'>
            {playlist.images[0]?.url && (
              <img
                src={playlist.images[0].url}
                alt={playlist.name}
                className='h-full w-full object-cover'
                loading='lazy'
              />
            )}
          </div>
          <div className='flex w-full items-center justify-between'>
            <div className='flex flex-col items-start gap-1'>
              <span className='text-sm font-semibold'>{playlist.name}</span>
              <span className='text-xs text-gray-400'>
                Spotify · Vibe session
              </span>
            </div>
            <div
              className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-xs font-semibold text-black transition-transform hover:scale-108'
              onClick={e => {
                e.stopPropagation() // Prevent outer button click
                // Handle play button click
                console.log('Play playlist:', playlist.name)
              }}
            >
              <HiPlay size={14} />
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
