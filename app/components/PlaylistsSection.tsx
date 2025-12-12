'use client'
import { HiPlay } from 'react-icons/hi2'
import { Playlist } from '../models/Playlist'
import Image from 'next/image'
import { getSpotifyAccessToken, playSpotifyTrack } from '../api'
import { useRouter } from 'next/navigation'
import { useContext } from 'react'
import { PlayBarContext } from '../providers/PlayBarProvider'
import { SpotifyTrack } from '../models/Track'

export function PlaylistsSection({
  playlists,
  isLoggedIn
}: {
  playlists: Playlist[]
  isLoggedIn: boolean
}) {
  const { setTrack, setQueue } = useContext(PlayBarContext)
  const router = useRouter()

  const handlePlayPlaylist = async (
    e: React.MouseEvent,
    playlist: Playlist
  ) => {
    e.stopPropagation()

    if (playlist.type !== 'spotify' || !isLoggedIn) {
      return
    }

    try {
      const accessToken = await getSpotifyAccessToken()
      const response = await fetch(playlist.tracks.href, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch playlist tracks')
      }

      const data = await response.json()

      if (!data.items || data.items.length === 0) {
        console.error('No tracks in playlist')
        return
      }

      const tracks: SpotifyTrack[] = data.items.map(
        (item: { track: SpotifyTrack }) => ({
          id: item.track.id,
          title: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          artworkUrl: item.track.album?.images?.[0]?.url || '',
          uri: item.track.uri as string,
          source: 'spotify' as const,
          duration_ms: item.track.duration_ms,
          album: {
            name: item.track.album?.name || 'Unknown Album'
          },
          artists: item.track.artists || []
        })
      )

      const firstTrack = tracks[0]
      if (!firstTrack) return null

      await setTrack(firstTrack)
      setQueue(firstTrack, tracks)

      const trackUris: string[] = tracks.map(t => t.uri ?? '')
      await playSpotifyTrack({ uris: trackUris, offset: 0 })
    } catch (error) {
      console.error('Error playing playlist:', error)
    }
  }

  const handleClick = (playlist: Playlist) => {
    if (playlist.type === 'spotify') {
      router.push(`/spotify/playlist/${playlist.id}`)
    } else {
      router.push(`/studio/playlist/${playlist.name.toLowerCase()}`)
    }
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {playlists.map(playlist => (
        <button
          key={playlist.id}
          className='bg-white/5/5 flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/5 p-5 transition-colors hover:border-fuchsia-400/60 hover:bg-white/10'
          onClick={() => handleClick(playlist)}
        >
          <div className='h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500'>
            {playlist.images[0]?.url && (
              <Image
                width={800}
                height={800}
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
                {playlist.type === 'spotify'
                  ? 'Spotify · Vibe session'
                  : 'Beats · Vibe session'}
              </span>
            </div>
            <div
              className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-xs font-semibold text-black transition-transform hover:scale-110'
              onClick={e => handlePlayPlaylist(e, playlist)}
            >
              <HiPlay size={14} />
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
