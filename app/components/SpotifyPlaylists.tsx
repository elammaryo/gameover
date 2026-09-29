'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useContext, useState } from 'react'
import { Lock } from 'lucide-react'
import { SiSpotify } from 'react-icons/si'
import type { Playlist } from '../models/Playlist'
import { SpotifyTrack } from '../models/Track'
import { PlayBarContext } from '../providers/PlayBarProvider'
import { getSpotifyAccessToken, playSpotifyTrack } from '../api'
import { PlayButton } from './ui'
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

export function SpotifyPlaylistGrid({
  playlists,
  isLoggedIn,
  className
}: {
  playlists: Playlist[]
  isLoggedIn: boolean
  className?: string
}) {
  const { play, stateOf } = useSpotifyPlaylistPlayback()

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 [&>article:has(a:focus-visible)]:ring-2 [&>article:has(a:focus-visible)]:ring-live',
        className
      )}
    >
      {playlists.map(playlist => {
        const { current, playing } = stateOf(playlist)
        return (
          <article
            key={playlist.id}
            className={cn(
              'group surface relative isolate flex flex-col gap-3 rounded-2xl p-2.5 transition-[border-color,transform] duration-300 ease-snap hover:-translate-y-0.5 hover:border-white/15 sm:p-3',
              current && 'border-spotify/30'
            )}
          >
            <div className='relative'>
              <PlaylistArt
                playlist={playlist}
                sizes='(min-width: 1024px) 280px, (min-width: 768px) 30vw, 45vw'
                className='w-full transition-transform duration-500 ease-snap group-hover:scale-[1.015]'
              />
              {isLoggedIn && (
                <PlayButton
                  size='lg'
                  tone={current ? 'signal' : 'bone'}
                  playing={playing}
                  label={`${playing ? 'Pause' : 'Play'} ${playlist.name}`}
                  onClick={() => play(playlist)}
                  className={cn(
                    'absolute right-2.5 bottom-2.5 z-10 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.8)] transition-[opacity,transform,background-color] duration-200 sm:right-3 sm:bottom-3',
                    !current &&
                      'sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100'
                  )}
                />
              )}
            </div>
            <div className='min-w-0 px-1 pb-1'>
              <h3 className='truncate'>
                <Link
                  href={`/spotify/playlist/${playlist.id}`}
                  className='text-[15px] font-semibold text-bone after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none sm:text-base'
                >
                  {playlist.name}
                </Link>
              </h3>
              <p className='tabular mt-1.5 flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-bone-dim uppercase'>
                {!isLoggedIn && <Lock className='size-3' aria-hidden />}
                {playlist.tracks?.total ?? 0} tracks
              </p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
