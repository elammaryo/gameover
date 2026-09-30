'use client'

import Image from 'next/image'
import { useContext, useState } from 'react'
import { SiSpotify } from 'react-icons/si'
import type { Playlist } from '../models/Playlist'
import { SpotifyTrack } from '../models/Track'
import { PlayBarContext } from '../providers/PlayBarProvider'
import { getSpotifyAccessToken, playSpotifyTrack } from '../api'
import { cn } from '@/lib/utils'

/** Start a whole Spotify playlist from the top (needs a connected account). */
export function useSpotifyPlaylistPlayback() {
  const { setTrack, setQueue, selectedTrack, isPlaying, setPlayPause } =
    useContext(PlayBarContext)
  const [startedId, setStartedId] = useState<string | null>(null)

  const stateOf = (playlist: Playlist) => {
    const current =
      startedId === playlist.id && selectedTrack?.source === 'spotify'
    return { current, playing: current && isPlaying }
  }

  const play = async (playlist: Playlist) => {
    if (stateOf(playlist).current) {
      setPlayPause(!isPlaying)
      return
    }
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
      const first = tracks[0]
      if (!first) return
      await setTrack(first)
      setQueue(first, tracks)
      setStartedId(playlist.id)
      await playSpotifyTrack({ uris: tracks.map(t => t.uri ?? ''), offset: 0 })
    } catch (error) {
      console.error('Error playing playlist:', error)
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
