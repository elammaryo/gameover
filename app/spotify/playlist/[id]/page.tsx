'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowUpRight, Lock, Pause, Play } from 'lucide-react'
import { SiSpotify } from 'react-icons/si'
import { getPlaylistTracks, playSpotifyTrack } from '@/app/api'
import type { Playlist } from '@/app/models/Playlist'
import { SpotifyTrack } from '@/app/models/Track'
import { PlayBarContext } from '@/app/providers/PlayBarProvider'
import { Button, buttonClasses } from '@/app/components/Button'
import { PlaylistArt } from '@/app/components/SpotifyPlaylists'
import {
  BackLink,
  EmptyState,
  EqBars,
  Eyebrow,
  Page,
  Skeleton
} from '@/app/components/ui'
import { useSpotifySession } from '@/app/components/useSpotifySession'
import { formatLongDuration, formatMs, htmlToText } from '@/lib/beats'
import { handleLogin } from '@/lib/spotify-auth'
import { cn } from '@/lib/utils'

const COLS =
  'md:grid-cols-[2.25rem_minmax(0,1.4fr)_minmax(0,1fr)_3.5rem]'

export default function SpotifyPlaylistPage() {
  const params = useParams()
  const id = String(params.id ?? '')
  const session = useSpotifySession()
  const connected = session === 'connected'
  const { setQueue, setTrack, setPlayPause, selectedTrack, isPlaying } =
    useContext(PlayBarContext)

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPlaylistTracks(id)
      .then(setPlaylist)
      .catch(error => console.error('Error fetching playlist:', error))
      .finally(() => setLoading(false))
  }, [id])

  // Rows skip unplayable items (local files have no id), but keep each
  // track's original position: that's the offset Spotify's context expects.
  const rows = useMemo(
    () =>
      (playlist?.tracks?.items ?? []).flatMap((item, position) =>
        item?.track?.id
          ? [
              {
                position,
                track: new SpotifyTrack({ ...item.track, title: item.track.name })
              }
            ]
          : []
      ),
    [playlist]
  )
  const tracks = useMemo(() => rows.map(r => r.track), [rows])

  const onList = tracks.some(t => t.id === selectedTrack?.id)
  const listPlaying = onList && isPlaying
  const totalMs = tracks.reduce((sum, t) => sum + (t.duration_ms ?? 0), 0)

  const playFrom = (index: number) => {
    if (session === 'checking') return
    if (!connected) {
      handleLogin()
      return
    }
    const row = rows[index]
    if (!row || !playlist) return
    if (selectedTrack?.id === row.track.id) {
      setPlayPause(!isPlaying)
      return
    }
    playSpotifyTrack({ contextUri: playlist.uri, offset: row.position })
    setTrack(row.track)
    setQueue(row.track, tracks)
  }

  const playAll = () => {
    if (connected && onList) {
      setPlayPause(!isPlaying)
      return
    }
    playFrom(0)
  }

  if (loading) {
    return (
      <Page>
        <BackLink href='/spotify'>Spotify</BackLink>
        <div className='mt-6 grid gap-8 sm:grid-cols-[15rem_1fr] sm:items-end md:grid-cols-[18rem_1fr] md:gap-12'>
          <Skeleton className='aspect-square w-full max-w-[18rem] rounded-3xl' />
          <div className='flex flex-col gap-4'>
            <Skeleton className='h-3 w-28' />
            <Skeleton className='h-16 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
            <Skeleton className='h-12 w-64' />
          </div>
        </div>
        <div className='mt-12 flex flex-col gap-2'>
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className='h-[60px]' />
          ))}
        </div>
      </Page>
    )
  }

  if (!playlist) {
    return (
      <Page>
        <BackLink href='/spotify'>Spotify</BackLink>
        <EmptyState
          className='mt-8'
          title='This playlist didn’t load'
          action={
            <Link href='/spotify' className={buttonClasses({ variant: 'secondary' })}>
              Back to all playlists
            </Link>
          }
        >
          It may be private, or Spotify didn’t answer. Try again in a moment.
        </EmptyState>
      </Page>
    )
  }

  const description = htmlToText(playlist.description)

  return (
    <Page>
      <BackLink href='/spotify'>Spotify</BackLink>

      <header className='mt-6 grid gap-8 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-end md:grid-cols-[minmax(0,18rem)_1fr] md:gap-12'>
        <PlaylistArt
          playlist={playlist}
          sizes='(min-width: 768px) 288px, (min-width: 640px) 240px, 80vw'
          priority
          className='w-full max-w-[18rem] rounded-3xl shadow-[0_40px_90px_-40px_rgb(0_0_0/0.9)]'
        />
        <div className='flex min-w-0 flex-col gap-5'>
          <Eyebrow color='var(--color-spotify)'>Playlist</Eyebrow>
          <h1 className='font-display-wide text-[clamp(2.4rem,7vw,5.25rem)] text-balance break-words text-bone'>
            {playlist.name}
          </h1>
          {description && (
            <p className='max-w-2xl text-lg leading-relaxed text-bone-muted'>
              {description}
            </p>
          )}
          <p className='tabular font-mono text-xs tracking-[0.14em] text-bone-dim uppercase'>
            {playlist.owner?.displayName ?? 'GameOver'} ·{' '}
            {playlist.tracks?.total ?? tracks.length} songs
            {totalMs > 0 && ` · ${formatLongDuration(totalMs)}`}
          </p>
          <div className='flex flex-wrap items-center gap-3'>
            {connected ? (
              <Button size='lg' onClick={playAll} disabled={!tracks.length}>
                {listPlaying ? (
                  <Pause className='size-4' fill='currentColor' strokeWidth={0} />
                ) : (
                  <Play className='size-4' fill='currentColor' strokeWidth={0} />
                )}
                {listPlaying ? 'Pause' : onList ? 'Resume' : 'Play'}
              </Button>
            ) : (
              <Button
                size='lg'
                variant='spotify'
                onClick={handleLogin}
                disabled={session === 'checking'}
              >
                <SiSpotify className='size-4' />
                Connect to play
              </Button>
            )}
            <a
              href={playlist.external_urls?.spotify}
              target='_blank'
              rel='noopener noreferrer'
              className={buttonClasses({ variant: 'secondary', size: 'lg' })}
            >
              Open in Spotify
              <ArrowUpRight className='size-4' />
            </a>
          </div>
        </div>
      </header>

      <section aria-label='Tracks' className='mt-12'>
        {session === 'disconnected' && (
          <p className='mb-5 flex items-center gap-2.5 rounded-xl border border-line bg-white/[0.02] px-4 py-3 text-sm text-bone-muted'>
            <Lock className='size-4 shrink-0 text-bone-dim' />
            Browsing only. Connect Spotify (Premium) to play these tracks here.
          </p>
        )}

        <div
          aria-hidden
          className={cn(
            'hud-label hidden items-center gap-4 border-b border-line px-3 pb-3 md:grid',
            COLS
          )}
        >
          <span className='text-center'>#</span>
          <span>Title</span>
          <span>Album</span>
          <span className='text-right'>Time</span>
        </div>

        {tracks.length ? (
          <ol className='mt-2 flex flex-col gap-0.5'>
            {tracks.map((track, i) => {
              const current = selectedTrack?.id === track.id
              const playing = current && isPlaying
              const art = track.album?.images?.at(-1)?.url ?? track.artworkUrl
              return (
                <li
                  key={`${track.id}-${i}`}
                  className={cn(
                    'group/row relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-live md:gap-4 md:px-3',
                    COLS,
                    current ? 'bg-spotify/[0.07]' : 'hover:bg-white/[0.04]'
                  )}
                >
                  <span className='relative hidden size-9 items-center justify-center md:flex'>
                    {current && playing ? (
                      <EqBars className='[&>span]:bg-spotify' />
                    ) : (
                      <>
                        <span
                          className={cn(
                            'tabular font-mono text-xs transition-opacity group-hover/row:opacity-0',
                            current ? 'text-spotify' : 'text-bone-dim'
                          )}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {connected ? (
                          <Play
                            aria-hidden
                            className='absolute size-3.5 text-bone opacity-0 transition-opacity group-hover/row:opacity-100'
                            fill='currentColor'
                            strokeWidth={0}
                          />
                        ) : (
                          <Lock
                            aria-hidden
                            className='absolute size-3.5 text-bone-dim opacity-0 transition-opacity group-hover/row:opacity-100'
                          />
                        )}
                      </>
                    )}
                  </span>

                  <span className='flex min-w-0 items-center gap-3'>
                    <span className='relative size-11 shrink-0 overflow-hidden rounded-lg bg-ink-800 ring-1 ring-white/8 ring-inset sm:size-12'>
                      {art && (
                        <Image
                          src={art}
                          alt=''
                          fill
                          sizes='48px'
                          className='object-cover'
                        />
                      )}
                    </span>
                    <span className='min-w-0'>
                      <span
                        className={cn(
                          'flex min-w-0 items-center gap-2 text-[15px] font-semibold',
                          current ? 'text-spotify' : 'text-bone'
                        )}
                      >
                        <span className='truncate'>{track.name}</span>
                        {playing && (
                          <EqBars className='md:hidden [&>span]:bg-spotify' />
                        )}
                      </span>
                      <span className='block truncate text-[13px] text-bone-dim'>
                        {track.artists?.map(a => a.name).join(', ')}
                      </span>
                    </span>
                  </span>

                  <span className='hidden truncate text-sm text-bone-muted md:block'>
                    {track.album?.name}
                  </span>

                  <span className='flex items-center justify-end gap-3'>
                    <span className='tabular font-mono text-xs text-bone-dim'>
                      {formatMs(track.duration_ms ?? 0)}
                    </span>
                    <button
                      type='button'
                      onClick={() => playFrom(i)}
                      aria-label={
                        connected
                          ? `${playing ? 'Pause' : 'Play'} ${track.name}`
                          : `Connect Spotify to play ${track.name}`
                      }
                      className='after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none'
                    />
                  </span>
                </li>
              )
            })}
          </ol>
        ) : (
          <EmptyState className='mt-4' title='No tracks here yet' />
        )}
      </section>
    </Page>
  )
}
