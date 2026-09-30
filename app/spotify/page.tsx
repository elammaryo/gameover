'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SiSpotify } from 'react-icons/si'
import {
  HiLockClosed,
  HiMusicalNote,
  HiPause,
  HiPlay,
  HiSparkles
} from 'react-icons/hi2'
import { getSpotifyPlaylists } from '../api'
import type { Playlist } from '../models/Playlist'
import BlurText from '../components/BlurText'
import { CountUp } from '../components/CountUp'
import {
  useSpotifyPlaylistPlayback,
  type SpotifyPlaylistPlayback
} from '../components/SpotifyPlaylists'
import { useSpotifySession } from '../components/useSpotifySession'
import { htmlToText } from '@/lib/beats'
import { SPOTIFY_PROFILE_URL } from '@/lib/site'
import { handleLogin, handleLogout } from '@/lib/spotify-auth'

/*
  The Spotify page keeps its original design and cards (restored from the
  live site), now on the site-wide LED backdrop in its own greens. Under the
  hood it has the fixes: no "connect" flash for connected visitors, one
  shared playback state, real links and buttons (no button-in-a-button),
  and playlist descriptions decoded from Spotify's HTML.
*/

const STAT_STYLES = [
  { glow: 'from-green-500/10', tile: 'from-green-500 to-green-600' },
  { glow: 'from-emerald-500/10', tile: 'from-emerald-500 to-emerald-600' },
  { glow: 'from-teal-500/10', tile: 'from-teal-500 to-teal-600' }
]

export default function SpotifyPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const session = useSpotifySession()
  const isLoggedIn = session === 'connected'
  const playback = useSpotifyPlaylistPlayback()

  useEffect(() => {
    getSpotifyPlaylists()
      .then(setPlaylists)
      .catch(error => console.error('Error fetching playlists:', error))
      .finally(() => setLoading(false))
  }, [])

  const totalTracks = playlists.reduce((acc, p) => acc + (p.tracks?.total ?? 0), 0)
  const stats = [
    {
      label: 'Curated Playlists',
      value: playlists.length,
      icon: <HiMusicalNote size={20} />
    },
    {
      label: 'Total Tracks',
      value: totalTracks,
      icon: <HiSparkles size={20} />
    },
    {
      label: 'Hours of Music',
      value: Math.round((totalTracks * 3.5) / 60),
      icon: <SiSpotify size={20} />
    }
  ]
  const featured = playlists[0]

  return (
    <main className='relative min-h-screen text-white'>
      <div className='relative z-10 mx-auto max-w-6xl px-4 pt-[calc(var(--nav-h)+1.5rem)] pb-16 sm:px-6'>
        {/* HEADER */}
        <header className='mb-16 flex flex-col gap-6'>
          <div className='flex min-h-10 items-center justify-between'>
            <div className='flex items-center gap-3'>
              <SiSpotify className='text-green-500' size={24} />
              <h1 className='font-mono text-xs tracking-[0.35em] text-gray-400 uppercase sm:text-sm'>
                My Spotify
              </h1>
            </div>

            {session === 'connected' && (
              <button
                type='button'
                onClick={handleLogout}
                className='flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:border-red-500/50 hover:bg-red-500/20'
              >
                Logout
              </button>
            )}
            {session === 'disconnected' && (
              <button
                type='button'
                onClick={handleLogin}
                className='flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 transition-all hover:border-green-500/50 hover:bg-green-500/20'
              >
                <SiSpotify size={16} />
                Login to Play
              </button>
            )}
          </div>

          <BlurText
            text='Curated Playlists & Vibes'
            delay={50}
            animateBy='words'
            direction='top'
            className='text-4xl font-bold sm:text-5xl lg:text-6xl'
          />

          <p className='max-w-3xl text-lg text-gray-300 sm:text-xl'>
            Explore my personal collection of handpicked playlists spanning
            hip-hop, trap, drill, afrobeats, and experimental sounds. Each
            playlist is crafted for a specific mood and energy.
          </p>
        </header>

        {/* LOGIN CTA BANNER */}
        {session === 'disconnected' && (
          <section className='mb-12'>
            <div className='group relative overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/15 via-emerald-500/10 to-transparent p-8 backdrop-blur-sm transition-all hover:border-green-500/50'>
              <div className='absolute top-0 right-0 h-32 w-32 rounded-full bg-green-500/20 blur-3xl' />
              <div className='relative z-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left'>
                <div className='flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600'>
                  <HiLockClosed size={28} />
                </div>
                <div className='flex-1'>
                  <h2 className='mb-2 text-xl font-bold text-white sm:text-2xl'>
                    Want to listen on the website?
                  </h2>
                  <p className='text-sm text-gray-400 sm:text-base'>
                    Connect your Spotify account to play tracks directly in your
                    browser
                  </p>
                </div>
                <button
                  type='button'
                  onClick={handleLogin}
                  className='group/btn inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-green-500 px-6 py-3 font-semibold text-black transition-all hover:scale-105 hover:bg-green-400'
                >
                  <SiSpotify size={20} />
                  Connect Spotify
                  <span
                    aria-hidden
                    className='transition-transform group-hover/btn:translate-x-1'
                  >
                    →
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* STATS GRID */}
        {!loading && playlists.length > 0 && (
          <section aria-label='In numbers' className='mb-16 grid gap-4 sm:grid-cols-3'>
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className='intro-rise group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-green-400/40 hover:bg-white/10'
                style={{ '--i': i } as React.CSSProperties}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${STAT_STYLES[i].glow} to-transparent opacity-0 transition-opacity group-hover:opacity-100`}
                />
                <div className='relative z-10 flex items-center gap-4'>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${STAT_STYLES[i].tile}`}
                  >
                    {stat.icon}
                  </div>
                  <div className='flex flex-col'>
                    <div className='tabular text-3xl font-bold text-white'>
                      <CountUp value={stat.value} />
                    </div>
                    <div className='text-sm text-gray-400'>{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* FEATURED PLAYLIST HIGHLIGHT */}
        {!loading && featured && (
          <section aria-labelledby='featured-playlist' className='mb-16'>
            <h2
              id='featured-playlist'
              className='mb-6 font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'
            >
              Featured Playlist
            </h2>
            <div className='group relative overflow-hidden rounded-3xl border border-green-400/20 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-8 backdrop-blur-sm transition-all hover:border-green-400/40'>
              <div className='flex flex-col gap-6 sm:flex-row sm:items-center'>
                {featured.images?.[0]?.url && (
                  <div className='relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-green-500/20'>
                    <div className='h-full w-full transition-transform duration-500 group-hover:scale-110'>
                      <Image
                        height={300}
                        width={300}
                        src={featured.images[0].url}
                        alt=''
                        priority
                        className='h-full w-full object-cover'
                      />
                    </div>
                  </div>
                )}
                <div className='flex flex-col gap-3'>
                  <h3 className='text-3xl font-bold text-white'>{featured.name}</h3>
                  <p className='text-gray-400'>
                    {htmlToText(featured.description) || 'A curated selection of tracks'}
                  </p>
                  <div className='flex items-center gap-4 text-sm text-gray-500'>
                    <span>{featured.tracks?.total ?? 0} tracks</span>
                    <span aria-hidden>·</span>
                    <span>{featured.public ? 'Public' : 'Private'} Playlist</span>
                  </div>
                  <div className='mt-4'>
                    <Link
                      href={`/spotify/playlist/${featured.id}`}
                      className='inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 font-semibold text-black transition-all hover:scale-105 hover:bg-green-400'
                    >
                      <SiSpotify size={20} />
                      View Playlist
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PLAYLISTS SECTION */}
        <section aria-labelledby='all-playlists'>
          <div className='mb-6 flex items-center justify-between'>
            <h2
              id='all-playlists'
              className='font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'
            >
              All Playlists
            </h2>
            <span className='text-sm text-gray-500'>{playlists.length} playlists</span>
          </div>

          {loading ? (
            <div role='status' className='flex h-64 items-center justify-center'>
              <span className='sr-only'>Loading playlists</span>
              <div className='h-12 w-12 animate-spin rounded-full border-4 border-green-500/20 border-t-green-500' />
            </div>
          ) : playlists.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm'>
              <SiSpotify className='text-gray-600' size={48} />
              <p className='text-gray-400'>No playlists found. Check back soon!</p>
            </div>
          ) : (
            <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {playlists.map((playlist, i) => (
                <PlaylistCard
                  key={playlist.id}
                  index={i}
                  playlist={playlist}
                  isLoggedIn={isLoggedIn}
                  playback={playback}
                />
              ))}
            </ul>
          )}
        </section>

        {/* SPOTIFY PROFILE LINK */}
        <section className='mt-16 mb-24'>
          <div className='rounded-2xl border border-green-400/20 bg-gradient-to-r from-green-500/10 to-emerald-500/5 p-8 text-center backdrop-blur-sm'>
            <SiSpotify className='mx-auto mb-4 text-green-500' size={48} />
            <h2 className='mb-3 text-2xl font-bold text-white'>Follow me on Spotify</h2>
            <p className='mb-6 text-gray-400'>
              Stay updated with new playlists and music releases
            </p>
            <a
              href={SPOTIFY_PROFILE_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-full border border-green-500 bg-green-500/10 px-8 py-3 font-semibold text-green-400 transition-all hover:border-green-400 hover:bg-green-500/20'
            >
              Open Profile →
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}

/** The original playlist card; the whole card opens the playlist. */
function PlaylistCard({
  playlist,
  index,
  isLoggedIn,
  playback
}: {
  playlist: Playlist
  index: number
  isLoggedIn: boolean
  playback: SpotifyPlaylistPlayback
}) {
  const { play, stateOf } = playback
  const { current, playing } = stateOf(playlist)
  const cover = playlist.images?.[0]?.url

  return (
    <li
      className='intro-rise group relative flex flex-col gap-3 rounded-2xl border border-white/5 p-5 transition-colors hover:border-fuchsia-400/60 hover:bg-white/10 has-[a:focus-visible]:border-fuchsia-400/60 has-[a:focus-visible]:bg-white/10'
      style={{ '--i': Math.min(index, 8) } as React.CSSProperties}
    >
      <div className='aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500'>
        {cover && (
          <Image
            width={800}
            height={800}
            src={cover}
            alt=''
            sizes='(min-width: 1024px) 340px, (min-width: 640px) 45vw, 90vw'
            className='h-full w-full object-cover'
          />
        )}
      </div>
      <div className='flex w-full items-center justify-between gap-3'>
        <div className='flex min-w-0 flex-col items-start gap-1'>
          <Link
            href={`/spotify/playlist/${playlist.id}`}
            className='max-w-full truncate text-sm font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl'
          >
            {playlist.name}
          </Link>
          <span className='text-xs text-gray-400'>Spotify · Vibe session</span>
        </div>
        <button
          type='button'
          onClick={() => (isLoggedIn ? play(playlist) : handleLogin())}
          aria-label={
            isLoggedIn
              ? `${playing ? 'Pause' : current ? 'Resume' : 'Play'} ${playlist.name}`
              : `Connect Spotify to play ${playlist.name}`
          }
          className='relative z-10 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-xs font-semibold text-black transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 focus-visible:outline-none'
        >
          {playing ? <HiPause size={14} /> : <HiPlay size={14} />}
        </button>
      </div>
    </li>
  )
}
