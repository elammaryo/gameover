'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Lock, LogOut } from 'lucide-react'
import { SiSpotify } from 'react-icons/si'
import { getSpotifyPlaylists } from '../api'
import type { Playlist } from '../models/Playlist'
import { Button, buttonClasses } from '../components/Button'
import {
  PlaylistArt,
  SpotifyPlaylistGrid,
  useSpotifyPlaylistPlayback,
  type SpotifyPlaylistPlayback
} from '../components/SpotifyPlaylists'
import {
  CtaBand,
  EmptyState,
  Eyebrow,
  Page,
  PageHeader,
  PlayButton,
  SectionHeader,
  Skeleton,
  StatStrip
} from '../components/ui'
import { useSpotifySession, type SpotifySession } from '../components/useSpotifySession'
import { htmlToText } from '@/lib/beats'
import { SPOTIFY_PROFILE_URL } from '@/lib/site'
import { handleLogin, handleLogout } from '@/lib/spotify-auth'

export default function SpotifyPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const session = useSpotifySession()
  const connected = session === 'connected'
  const playback = useSpotifyPlaylistPlayback()

  useEffect(() => {
    getSpotifyPlaylists()
      .then(setPlaylists)
      .catch(error => console.error('Error fetching playlists:', error))
      .finally(() => setLoading(false))
  }, [])

  const totalTracks = playlists.reduce((sum, p) => sum + (p.tracks?.total ?? 0), 0)
  const dash = <span className='text-bone-dim'>—</span>
  const [featured] = playlists

  return (
    <Page>
      <PageHeader
        eyebrow='My Spotify'
        title='Curated playlists'
        aside={<SessionControl session={session} />}
      >
        Hand-picked from my own library: hip-hop, trap, drill, afrobeats and
        the experimental stuff. Each one is built for a mood.
      </PageHeader>

      {session === 'disconnected' && (
        <section
          aria-labelledby='connect-title'
          className='surface mt-10 flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:p-8'
          style={{
            backgroundImage:
              'radial-gradient(70% 140% at 0% 0%, rgb(30 215 96 / 0.12), transparent 70%)'
          }}
        >
          <div className='flex items-start gap-4 sm:gap-5'>
            <span className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-spotify/12 text-spotify ring-1 ring-spotify/30 ring-inset'>
              <Lock className='size-5' />
            </span>
            <div className='flex flex-col gap-1.5'>
              <h2
                id='connect-title'
                className='font-display-tight text-xl text-bone sm:text-2xl'
              >
                Listen right here
              </h2>
              <p className='max-w-xl text-[15px] leading-relaxed text-bone-muted'>
                Connect your Spotify account to play these playlists in the
                browser. Browsing is open to everyone; in-browser playback needs
                Spotify Premium.
              </p>
            </div>
          </div>
          <Button
            variant='spotify'
            size='lg'
            onClick={handleLogin}
            className='shrink-0 self-start sm:self-auto'
          >
            <SiSpotify className='size-[18px]' />
            Connect Spotify
          </Button>
        </section>
      )}

      <StatStrip
        className='mt-10'
        items={[
          { label: 'Playlists', value: loading ? dash : playlists.length },
          { label: 'Tracks', value: loading ? dash : totalTracks },
          {
            label: 'Listening',
            value: loading ? dash : `≈${Math.round((totalTracks * 3.5) / 60)}`,
            hint: loading ? undefined : 'hrs'
          },
          {
            label: 'Per playlist',
            value:
              loading || !playlists.length
                ? dash
                : Math.round(totalTracks / playlists.length),
            hint: loading || !playlists.length ? undefined : 'tracks avg'
          }
        ]}
      />

      {/* FEATURED */}
      {(loading || featured) && (
        <section aria-labelledby='featured-playlist' className='mt-20 sm:mt-24'>
          <SectionHeader
            id='featured-playlist'
            eyebrow='Featured playlist'
            title='On heavy rotation'
          />
          {loading ? (
            <Skeleton className='h-[420px] rounded-3xl md:h-[340px]' />
          ) : (
            <FeaturedPlaylist
              playlist={featured}
              connected={connected}
              playback={playback}
            />
          )}
        </section>
      )}

      {/* ALL */}
      <section aria-labelledby='all-playlists' className='mt-20 sm:mt-24'>
        <SectionHeader
          id='all-playlists'
          eyebrow='Library'
          title='All playlists'
          action={
            !loading && playlists.length > 0 ? (
              <span className='hud-label tabular'>
                {playlists.length} playlists
              </span>
            ) : undefined
          }
        />
        {loading ? (
          <div className='grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4'>
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className='aspect-[4/5] rounded-2xl' />
            ))}
          </div>
        ) : playlists.length ? (
          <SpotifyPlaylistGrid
            playlists={playlists}
            isLoggedIn={connected}
            playback={playback}
          />
        ) : (
          <EmptyState title='No playlists to show'>
            Spotify didn’t answer this time. Refresh to try again, or check
            back soon.
          </EmptyState>
        )}
      </section>

      <CtaBand
        className='mt-24 sm:mt-32'
        icon={<SiSpotify />}
        accent='var(--color-spotify)'
        variant='spotify'
        title='Follow me on Spotify'
        href={SPOTIFY_PROFILE_URL}
        cta='Open profile'
      >
        New playlists land there first, along with whatever’s on repeat.
      </CtaBand>
    </Page>
  )
}

/** Shown once connected; the disconnected state gets the banner instead. */
function SessionControl({ session }: { session: SpotifySession }) {
  if (session !== 'connected') return null
  return (
    <div className='flex items-center gap-2'>
      <span className='inline-flex h-11 items-center gap-2.5 rounded-xl border border-spotify/30 bg-spotify/10 px-4 text-sm font-semibold text-spotify'>
        <span
          aria-hidden
          className='size-2 rounded-full bg-spotify shadow-[0_0_10px_var(--color-spotify)]'
        />
        Spotify connected
      </span>
      <Button variant='ghost' onClick={handleLogout} aria-label='Log out of Spotify'>
        <LogOut className='size-4' />
        <span className='hidden sm:inline'>Log out</span>
      </Button>
    </div>
  )
}

function FeaturedPlaylist({
  playlist,
  connected,
  playback
}: {
  playlist: Playlist
  connected: boolean
  playback: SpotifyPlaylistPlayback
}) {
  const { play, stateOf } = playback
  const { current, playing } = stateOf(playlist)
  const description = htmlToText(playlist.description)

  return (
    <article
      className='surface relative isolate grid gap-6 overflow-hidden rounded-3xl p-4 sm:p-6 md:grid-cols-[minmax(0,300px)_1fr] md:items-center md:gap-10'
      style={{
        backgroundImage:
          'radial-gradient(60% 90% at 100% 100%, rgb(30 215 96 / 0.10), transparent 70%)'
      }}
    >
      <PlaylistArt
        playlist={playlist}
        sizes='(min-width: 768px) 300px, 90vw'
        priority
        className='w-full rounded-2xl shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]'
      />
      <div className='flex min-w-0 flex-col gap-4 px-2 pb-2 md:px-0 md:pb-0'>
        <Eyebrow color='var(--color-spotify)'>
          {playlist.public ? 'Public playlist' : 'Playlist'}
        </Eyebrow>
        <h3 className='font-display-wide text-[clamp(2rem,4.6vw,3.6rem)] text-balance text-bone'>
          {playlist.name}
        </h3>
        <p className='max-w-xl text-base leading-relaxed text-bone-muted sm:text-lg'>
          {description || 'A curated selection of tracks for one mood.'}
        </p>
        <p className='tabular font-mono text-xs tracking-[0.14em] text-bone-dim uppercase'>
          {playlist.owner?.displayName ?? 'GameOver'} · {playlist.tracks?.total ?? 0}{' '}
          tracks
        </p>
        <div className='mt-2 flex flex-wrap items-center gap-3'>
          {connected && (
            <PlayButton
              size='lg'
              tone='signal'
              playing={playing}
              label={`${playing ? 'Pause' : current ? 'Resume' : 'Play'} ${playlist.name}`}
              onClick={() => play(playlist)}
            />
          )}
          <Link
            href={`/spotify/playlist/${playlist.id}`}
            className={buttonClasses({
              variant: connected ? 'secondary' : 'primary',
              size: 'lg',
              className: 'group/view'
            })}
          >
            View playlist
            <ArrowRight className='size-4 transition-transform duration-200 group-hover/view:translate-x-0.5' />
          </Link>
        </div>
      </div>
    </article>
  )
}
