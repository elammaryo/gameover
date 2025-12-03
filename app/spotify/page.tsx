'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { NavBar } from '../components/NavBar'
import BlurText from '../components/BlurText'
import Aurora from '../components/Aurora'
import { PlaylistsSection } from '../components/PlaylistsSection'
import { getPlaylists, getSpotifyAccessToken } from '../api'
import { Playlist } from '../models/Playlist'
import { SiSpotify } from 'react-icons/si'
import { HiMusicalNote, HiSparkles, HiLockClosed } from 'react-icons/hi2'
import { handleLogin, handleLogout } from '@/lib/spotify'
import { SpotifyPlayerInitializer } from '../components/SpotifyPlayerInitializer'

export default function SpotifyPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const overlay = document.getElementById('transition-overlay')
    const label = document.getElementById('transition-label')

    if (label) {
      label.classList.remove('opacity-100', 'glitch-once')
    }

    if (overlay) {
      overlay.style.opacity = '1'
      requestAnimationFrame(() => {
        overlay.style.opacity = '0'
      })
    }

    const loggedIn = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('spotify_logged_in='))
      ?.split('=')[1]

    getSpotifyAccessToken().then(token => {
      const tokenExists = token !== undefined && token !== null
      if (loggedIn === 'true' && tokenExists) {
        setIsLoggedIn(true)
      } else if (loggedIn === 'true' && !tokenExists) {
        // TODO(): use refresh token to get a new access token
      } else {
        setIsLoggedIn(false)
      }
    })

    getPlaylists()
      .then(data => {
        setPlaylists(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching playlists:', error)
        setLoading(false)
      })
  }, [])

  const stats = [
    {
      label: 'Curated Playlists',
      value: playlists.length,
      icon: <HiMusicalNote size={20} />,
      color: 'green'
    },
    {
      label: 'Total Tracks',
      value: playlists.reduce((acc, p) => acc + p.tracks.total, 0),
      icon: <HiSparkles size={20} />,
      color: 'emerald'
    },
    {
      label: 'Hours of Music',
      value: Math.round(
        (playlists.reduce((acc, p) => acc + p.tracks.total, 0) * 3.5) / 60
      ),
      icon: <SiSpotify size={20} />,
      color: 'teal'
    }
  ]

  return (
    <main className='relative min-h-screen bg-[#07050A] text-white'>
      <SpotifyPlayerInitializer isLoggedIn={isLoggedIn} />
      {/* Aurora background */}
      <div className='pointer-events-none fixed inset-0 opacity-40'>
        <Aurora
          colorStops={['#1DB954', '#1ed760', '#00ff7f']}
          amplitude={1.3}
          blend={0.7}
          speed={0.35}
        />
      </div>

      <NavBar selectedTab='spotify' />

      <div className='relative z-10 mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-6'>
        {/* HEADER */}
        <header className='mb-16 flex flex-col gap-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <SiSpotify className='text-green-500' size={24} />
              <h1 className='font-mono text-xs tracking-[0.35em] text-gray-400 uppercase sm:text-sm'>
                My Spotify
              </h1>
            </div>

            {/* Login/Logout Button in Header */}
            {isLoggedIn ? (
              <button
                onClick={async () => {
                  await handleLogout()
                  setIsLoggedIn(false)
                }}
                className='flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:border-red-500/50 hover:bg-red-500/20'
              >
                Logout
              </button>
            ) : (
              <button
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

        {/* LOGIN CTA BANNER (prominent placement) */}
        {!isLoggedIn && (
          <section className='mb-12'>
            <div className='group relative overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/15 via-emerald-500/10 to-transparent p-8 backdrop-blur-sm transition-all hover:border-green-500/50'>
              <div className='absolute top-0 right-0 h-32 w-32 rounded-full bg-green-500/20 blur-3xl' />
              <div className='relative z-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left'>
                <div className='flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600'>
                  <HiLockClosed size={28} />
                </div>
                <div className='flex-1'>
                  <h3 className='mb-2 text-xl font-bold text-white sm:text-2xl'>
                    Want to listen on the website?
                  </h3>
                  <p className='text-sm text-gray-400 sm:text-base'>
                    Connect your Spotify account to play tracks directly in your
                    browser
                  </p>
                </div>
                <button
                  onClick={handleLogin}
                  className='group/btn inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-green-500 px-6 py-3 font-semibold text-black transition-all hover:scale-105 hover:bg-green-400'
                >
                  <SiSpotify size={20} />
                  Connect Spotify
                  <span className='transition-transform group-hover/btn:translate-x-1'>
                    →
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* STATS GRID */}
        {!loading && playlists.length > 0 && (
          <section className='mb-16 grid gap-4 sm:grid-cols-3'>
            {stats.map(stat => (
              <div
                key={stat.label}
                className='group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-green-400/40 hover:bg-white/10'
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100`}
                />
                <div className='relative z-10 flex items-center gap-4'>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600`}
                  >
                    {stat.icon}
                  </div>
                  <div className='flex flex-col'>
                    <div className='text-3xl font-bold text-white'>
                      {stat.value}
                    </div>
                    <div className='text-sm text-gray-400'>{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* FEATURED PLAYLIST HIGHLIGHT */}
        {!loading && playlists.length > 0 && (
          <section className='mb-16'>
            <h2 className='mb-6 font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
              Featured Playlist
            </h2>
            <div className='group relative overflow-hidden rounded-3xl border border-green-400/20 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-8 backdrop-blur-sm transition-all hover:border-green-400/40'>
              <div className='flex flex-col gap-6 sm:flex-row sm:items-center'>
                {playlists[0]?.images[0]?.url && (
                  <div className='relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-green-500/20'>
                    <div className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'>
                      <Image
                        height={300}
                        width={300}
                        src={playlists[0].images[0].url}
                        alt={playlists[0].name}
                      />
                    </div>
                  </div>
                )}
                <div className='flex flex-col gap-3'>
                  <h3 className='text-3xl font-bold text-white'>
                    {playlists[0]?.name}
                  </h3>
                  <p className='text-gray-400'>
                    {playlists[0]?.description ||
                      'A curated selection of tracks'}
                  </p>
                  <div className='flex items-center gap-4 text-sm text-gray-500'>
                    <span>{playlists[0]?.tracks.total} tracks</span>
                    <span>·</span>
                    <span>
                      {playlists[0]?.public ? 'Public' : 'Private'} Playlist
                    </span>
                  </div>
                  <a
                    href={playlists[0]?.external_urls.spotify}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-green-500 px-6 py-3 font-semibold text-black transition-all hover:scale-105 hover:bg-green-400'
                  >
                    <SiSpotify size={20} />
                    Open in Spotify
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PLAYLISTS SECTION */}
        <section>
          <div className='mb-6 flex items-center justify-between'>
            <h2 className='font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
              All Playlists
            </h2>
            <span className='text-sm text-gray-500'>
              {playlists.length} playlists
            </span>
          </div>

          {loading ? (
            <div className='flex h-64 items-center justify-center'>
              <div className='h-12 w-12 animate-spin rounded-full border-4 border-green-500/20 border-t-green-500' />
            </div>
          ) : playlists.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm'>
              <SiSpotify className='text-gray-600' size={48} />
              <p className='text-gray-400'>
                No playlists found. Check back soon!
              </p>
            </div>
          ) : (
            <PlaylistsSection playlists={playlists} isLoggedIn={isLoggedIn} />
          )}
        </section>

        {/* SPOTIFY PROFILE LINK */}
        <section className='mt-16'>
          <div className='rounded-2xl border border-green-400/20 bg-gradient-to-r from-green-500/10 to-emerald-500/5 p-8 text-center backdrop-blur-sm'>
            <SiSpotify className='mx-auto mb-4 text-green-500' size={48} />
            <h3 className='mb-3 text-2xl font-bold text-white'>
              Follow me on Spotify
            </h3>
            <p className='mb-6 text-gray-400'>
              Stay updated with new playlists and music releases
            </p>
            <a
              href='https://open.spotify.com/user/groudono'
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
