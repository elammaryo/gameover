'use client'

import Image from 'next/image'
import { SiSpotify } from 'react-icons/si'
import type { Playlist } from '../models/Playlist'
import { SpotifyTrack } from '../models/Track'
import {
  playerActions as p,
  usePlayerSelect,
  useNowPlaying
} from '../providers/PlayBarProvider'
import { getSpotifyAccessToken } from '../api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export const spotifyContext = (playlist: Pick<Playlist, 'id' | 'name'>) => ({
  id: `spotify:${playlist.id}`,
  name: playlist.name
})

/** Start a whole Spotify playlist from the top (needs a connected account). */
export function useSpotifyPlaylistPlayback() {
  const now = useNowPlaying()
  const onSpotify = usePlayerSelect(
    s => s.queue.items[s.queue.index]?.track.source === 'spotify',
    false
  )

  const stateOf = (playlist: Playlist) => {
    const current = now.contextId === spotifyContext(playlist).id && onSpotify
    return { current, playing: current && now.isPlaying }
  }

  const play = async (playlist: Playlist) => {
    if (stateOf(playlist).current) {
      p.toggle()
      return
    }
    // the tracks load first: let the browser allow playback while we're
    // still inside the tap
    p.prime('spotify')
    try {
      const accessToken = await getSpotifyAccessToken()
      const response = await fetch(playlist.tracks.href, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error('Failed to fetch playlist tracks')
      const data = await response.json()
      const tracks: SpotifyTrack[] = (data.items ?? [])
        .filter((item: { track?: SpotifyTrack }) => item?.track?.id)
        .map(
          (item: { track: SpotifyTrack }) =>
            new SpotifyTrack({ ...item.track, title: item.track.name })
        )
      if (!tracks.length) return
      p.play(tracks, 0, spotifyContext(playlist))
    } catch (error) {
      console.error('Error playing playlist:', error)
      toast('Couldn’t load that playlist', playlist.name, 'warn')
    }
  }

  return { play, stateOf }
}

export function PlaylistArt({
  playlist,
  className,
  sizes,
  priority
}: {
  playlist: Pick<Playlist, 'images' | 'name'>
  className?: string
  sizes: string
  priority?: boolean
}) {
  const url = playlist.images?.[0]?.url
  return (
    <div
      className={cn(
        'relative aspect-square shrink-0 overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/8 ring-inset',
        className
      )}
    >
      {url ? (
        <Image
          src={url}
          alt=''
          fill
          sizes={sizes}
          priority={priority}
          className='object-cover'
        />
      ) : (
        <div className='flex h-full w-full items-center justify-center bg-[radial-gradient(80%_80%_at_50%_30%,rgb(30_215_96/0.22),transparent_70%)]'>
          <SiSpotify className='size-1/4 text-spotify/70' aria-hidden />
        </div>
      )}
    </div>
  )
}

export type SpotifyPlaylistPlayback = ReturnType<typeof useSpotifyPlaylistPlayback>
