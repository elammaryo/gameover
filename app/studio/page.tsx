'use client'
import { useEffect, useState } from 'react'
import { NavBar } from '../components/NavBar'
import FeaturedBeatsSection from '../components/FeaturedBeatCard'
import { getBeats, getPlaylists } from '../api'
import { Playlist } from '../models/Playlist'
import { BeatTrack } from '../models/Track'
import { PlaylistsSection } from '../components/PlaylistsSection'
import { BeatsSection } from '../components/BeatsSection'
import Aurora from '../components/Aurora'
import BlurText from '../components/BlurText'
import { HiMusicalNote, HiSparkles } from 'react-icons/hi2'
import { SiSoundcloud } from 'react-icons/si'

const tabs = ['Beats', 'Playlists'] as const
type Tab = (typeof tabs)[number]

export default function Studio() {
  const [activeTab, setActiveTab] = useState<Tab>('Beats')
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [beats, setBeats] = useState<BeatTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [beatsLoading, setBeatsLoading] = useState(true)
  const [playlistsLoading, setPlaylistsLoading] = useState(true)

  useEffect(() => {
    getBeats()
      .then((data: BeatTrack[]) => {
        setBeats(data)
        setBeatsLoading(false)
      })
      .catch((error: any) => {
        console.error('Error fetching beats:', error)
        setBeatsLoading(false)
      })

    getPlaylists()
      .then((data: Playlist[]) => {
        setPlaylists(data)
        setPlaylistsLoading(false)
      })
      .catch((error: any) => {
        console.error('Error fetching playlists:', error)
        setPlaylistsLoading(false)
      })

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
  }, [])

  useEffect(() => {
    if (!beatsLoading && !playlistsLoading) {
      setLoading(false)
    }
  }, [beatsLoading, playlistsLoading])

  const featuredBeats = beats.filter(
    beat =>
      beat.id === '109' ||
      beat.id === '79' ||
      beat.id === '84' ||
      beat.id === '80' ||
      beat.id === '88' ||
      beat.id === '91'
  )

  return (
    <main className='relative min-h-screen bg-[#07050A] pb-20 text-white'>
      {/* Cyan/Blue Aurora background for cohesive studio vibe */}
      <div className='pointer-events-none fixed inset-0 opacity-30'>
        <Aurora
          colorStops={['#00d4ff', '#0ea5e9', '#3b82f6']}
          amplitude={1.3}
          blend={0.7}
          speed={0.35}
        />
      </div>

      <NavBar selectedTab='studio' />

      <div className='relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-24 pb-16 sm:px-6'>
        {/* HEADER SECTION */}
        <header className='mb-8 flex flex-col gap-6'>
          <div className='flex items-center gap-3'>
            <HiMusicalNote className='text-cyan-400' size={24} />
            <h1 className='font-mono text-xs tracking-[0.35em] text-gray-400 uppercase sm:text-sm'>
              GameOver Studio
            </h1>
          </div>

          <BlurText
            text='Premium Beats & Curated Playlists'
            delay={50}
            animateBy='words'
            direction='top'
            className='text-4xl font-bold sm:text-5xl lg:text-6xl'
          />

          <p className='max-w-3xl text-lg text-gray-300 sm:text-xl'>
            Explore hard-hitting trap, drill, and afrobeats. Stream directly or
            browse curated Spotify playlists for the perfect vibe.
          </p>

          {/* Genre Pills */}
          <div className='flex flex-wrap items-center gap-3'>
            {['Trap', 'Drill', 'Afrobeats', 'Experimental'].map(genre => (
              <span
                key={genre}
                className='inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20'
              >
                {genre}
              </span>
            ))}
          </div>
        </header>

        {/* FEATURED BEATS SECTION */}
        <section className='mb-8'>
          {beatsLoading ? (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className='h-48 animate-pulse rounded-2xl bg-white/5'
                />
              ))}
            </div>
          ) : (
            <FeaturedBeatsSection
              featuredBeats={featuredBeats}
              allBeats={beats}
            />
          )}
        </section>

        {/* LIBRARY STATS */}
        <section className='grid grid-cols-2 gap-4 md:grid-cols-4'>
          {/* Total Beats */}
          <div className='group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-cyan-400/40 hover:bg-white/10'>
            <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
            <div className='relative z-10'>
              <div className='mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600'>
                <HiMusicalNote size={20} />
              </div>
              {beatsLoading ? (
                <div className='h-9 w-16 animate-pulse rounded bg-white/10' />
              ) : (
                <div className='text-3xl font-bold text-white'>
                  {beats.length}
                </div>
              )}
              <div className='mt-1 text-xs tracking-[0.2em] text-gray-400 uppercase'>
                Total Beats
              </div>
            </div>
          </div>

          {/* Playlists */}
          <div className='group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-fuchsia-400/40 hover:bg-white/10'>
            <div className='absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
            <div className='relative z-10'>
              <div className='mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600'>
                <HiSparkles size={20} />
              </div>
              {playlistsLoading ? (
                <div className='h-9 w-16 animate-pulse rounded bg-white/10' />
              ) : (
                <div className='text-3xl font-bold text-fuchsia-400'>
                  {playlists.length}
                </div>
              )}
              <div className='mt-1 text-xs tracking-[0.2em] text-gray-400 uppercase'>
                Playlists
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className='group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-green-400/40 hover:bg-white/10'>
            <div className='absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
            <div className='relative z-10'>
              <div className='mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600'>
                <span className='text-xl'>🎼</span>
              </div>
              {beatsLoading ? (
                <div className='h-9 w-16 animate-pulse rounded bg-white/10' />
              ) : (
                <div className='text-3xl font-bold text-green-400'>
                  {new Set(beats.map(b => b.genre)).size}
                </div>
              )}
              <div className='mt-1 text-xs tracking-[0.2em] text-gray-400 uppercase'>
                Genres
              </div>
            </div>
          </div>

          {/* Avg BPM */}
          <div className='group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-orange-400/40 hover:bg-white/10'>
            <div className='absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
            <div className='relative z-10'>
              <div className='mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600'>
                <span className='text-xl'>⚡</span>
              </div>
              {beatsLoading ? (
                <div className='h-9 w-16 animate-pulse rounded bg-white/10' />
              ) : (
                <div className='text-3xl font-bold text-orange-400'>
                  {beats.length > 0
                    ? Math.round(
                        beats.reduce((acc, b) => acc + b.bpm, 0) / beats.length
                      )
                    : 0}
                </div>
              )}
              <div className='mt-1 text-xs tracking-[0.2em] text-gray-400 uppercase'>
                Avg BPM
              </div>
            </div>
          </div>
        </section>

        {/* TABS SECTION */}
        <section className='mt-4'>
          <div className='flex items-center justify-between border-b border-white/10 pb-4'>
            <div className='flex gap-6 text-sm'>
              {tabs.map(tab => {
                const isActive = tab === activeTab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`group relative pb-2 font-semibold tracking-[0.18em] uppercase transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab}
                    {isActive && (
                      <span className='absolute right-0 -bottom-[4px] left-0 mx-auto h-[3px] w-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 shadow-lg shadow-cyan-400/50' />
                    )}
                  </button>
                )
              })}
            </div>

            <div className='hidden text-xs tracking-[0.18em] text-gray-500 uppercase sm:block'>
              <span className='text-cyan-400'>●</span> Vibe · BPM · Energy
            </div>
          </div>
        </section>

        {/* CONTENT GRID / LIST */}
        <section className='mt-6'>
          {activeTab === 'Beats' ? (
            beatsLoading ? (
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className='h-40 animate-pulse rounded-2xl bg-white/5'
                  />
                ))}
              </div>
            ) : beats.length === 0 ? (
              <div className='flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm'>
                <HiMusicalNote className='text-gray-600' size={48} />
                <p className='text-gray-400'>No beats available yet.</p>
              </div>
            ) : (
              <BeatsSection beats={beats} />
            )
          ) : playlistsLoading ? (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className='h-64 animate-pulse rounded-2xl bg-white/5'
                />
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm'>
              <HiSparkles className='text-gray-600' size={48} />
              <p className='text-gray-400'>No playlists found.</p>
            </div>
          ) : (
            <PlaylistsSection playlists={playlists} isLoggedIn={false} />
          )}
        </section>

        {/* SOUNDCLOUD CTA */}
        <section className='mt-16'>
          <div className='rounded-2xl border border-orange-400/20 bg-gradient-to-r from-orange-500/10 to-red-500/5 p-8 text-center backdrop-blur-sm'>
            <SiSoundcloud className='mx-auto mb-4 text-orange-500' size={48} />
            <h3 className='mb-3 text-2xl font-bold text-white'>
              More Beats on SoundCloud
            </h3>
            <p className='mb-6 text-gray-400'>
              Discover exclusive releases, demos, and experimental tracks on my
              SoundCloud
            </p>
            <a
              href='https://soundcloud.com/goproductions'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-full border border-orange-500 bg-orange-500/10 px-8 py-3 font-semibold text-orange-400 transition-all hover:border-orange-400 hover:bg-orange-500/20'
            >
              Listen on SoundCloud →
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}
