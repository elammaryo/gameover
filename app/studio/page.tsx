'use client'
import { useEffect, useState } from 'react'
import { NavBar } from '../components/NavBar'
import FeaturedBeatsSection from '../components/FeaturedBeatCard'
import { PlayerBar } from '../components/PlayerBar'
import { getBeats, getPlaylists } from '../api'
import { Playlist } from '../models/Playlist'
import { BeatTrack, Track } from '../models/Track'
import { PlaylistsSection } from '../components/PlaylistsSection'
import { BeatsSection } from '../components/BeatsSection'
import FeaturedBeatCard from '../components/FeaturedBeatCard'
import Aurora from '../components/Aurora'

const tabs = ['Beats', 'Playlists'] as const
type Tab = (typeof tabs)[number]

export default function Studio() {
  const [activeTab, setActiveTab] = useState<Tab>('Beats')
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [beats, setBeats] = useState<BeatTrack[]>([])

  useEffect(() => {
    getBeats()
      .then((data: BeatTrack[]) => {
        setBeats(data)
      })
      .catch((error: any) => {
        console.error('Error fetching beats:', error)
      })
    getPlaylists()
      .then((data: Playlist[]) => {
        setPlaylists(data)
      })
      .catch((error: any) => {
        console.error('Error fetching playlists:', error)
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

  return (
    <main className='relative min-h-screen bg-[#07050A] pb-20 text-white'>
      {/* Aurora background */}
      <div className='pointer-events-none fixed inset-0 opacity-30'>
        <Aurora
          colorStops={['#8b5cf6', '#06b6d4', '#f59e0b']}
          amplitude={1.2}
          blend={0.65}
          speed={0.4}
        />
      </div>

      <NavBar selectedTab='studio' />

      <div className='relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-24 pb-16 sm:px-6'>
        {/* HEADER */}
        <header className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='font-mono text-xs tracking-[0.35em] text-gray-400 uppercase sm:text-sm'>
            GameOver Studio
          </h1>
          <span className='text-xs tracking-[0.2em] text-gray-500 uppercase'>
            Trap / Drill / Afro / Experimental
          </span>
        </header>

        <FeaturedBeatsSection
          featuredBeats={beats.filter(
            beat =>
              beat.id === '109' ||
              beat.id === '79' ||
              beat.id === '84' ||
              beat.id === '80' ||
              beat.id === '88' ||
              beat.id === '91'
          )}
          allBeats={beats}
        />

        {/* LIBRARY STATS */}
        <section className='grid grid-cols-2 gap-4 md:grid-cols-4'>
          {/* Total Beats */}
          <div className='rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm'>
            <div className='text-3xl font-bold text-white'>{beats.length}</div>
            <div className='mt-1 text-xs tracking-[0.2em] text-gray-400 uppercase'>
              Total Beats
            </div>
          </div>

          {/* Playlists */}
          <div className='rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm'>
            <div className='text-3xl font-bold text-cyan-400'>
              {playlists.length}
            </div>
            <div className='mt-1 text-xs tracking-[0.2em] text-gray-400 uppercase'>
              Playlists
            </div>
          </div>

          {/* Genres */}
          <div className='rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm'>
            <div className='text-3xl font-bold text-fuchsia-400'>
              {new Set(beats.map(b => b.genre)).size}
            </div>
            <div className='mt-1 text-xs tracking-[0.2em] text-gray-400 uppercase'>
              Genres
            </div>
          </div>

          {/* Avg BPM */}
          <div className='rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm'>
            <div className='text-3xl font-bold text-orange-400'>
              {beats.length > 0
                ? Math.round(
                    beats.reduce((acc, b) => acc + b.bpm, 0) / beats.length
                  )
                : 0}
            </div>
            <div className='mt-1 text-xs tracking-[0.2em] text-gray-400 uppercase'>
              Avg BPM
            </div>
          </div>
        </section>

        {/* TABS */}
        <section className='mt-2 flex items-center justify-between border-b border-white/10 pb-2'>
          <div className='flex gap-4 text-sm'>
            {tabs.map(tab => {
              const isActive = tab === activeTab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-2 tracking-[0.18em] uppercase transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab}
                  {isActive && (
                    <span className='absolute right-0 -bottom-[3px] left-0 mx-auto h-[2px] w-full max-w-[72px] rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400' />
                  )}
                </button>
              )
            })}
          </div>

          <div className='hidden text-xs tracking-[0.18em] text-gray-500 uppercase sm:block'>
            Vibe · BPM · Energy
          </div>
        </section>

        {/* CONTENT GRID / LIST */}
        <section className='mt-2'>
          {activeTab === 'Beats' ? (
            <BeatsSection beats={beats} />
          ) : (
            <PlaylistsSection playlists={playlists} />
          )}
        </section>
      </div>
      <PlayerBar />
    </main>
  )
}
