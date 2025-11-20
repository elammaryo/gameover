'use client'
import { useEffect, useState } from 'react'
import { NavBar } from '../components/NavBar'
import FeaturedBeatCard from '../components/FeaturedBeatCard'
import { PlayerBar } from '../components/PlayerBar'
import { getBeats, getPlaylists } from '../api'
import { HiPlay } from 'react-icons/hi2'
import { Playlist } from '../models/Playlist'
import { BeatTrack } from '../models/Track'
import { PlaylistsSection } from '../components/PlaylistsSection'
import { BeatsSection } from '../components/BeatsSection'

const tabs = ['Beats', 'Playlists'] as const
type Tab = (typeof tabs)[number]

export default function Studio() {
  const [activeTab, setActiveTab] = useState<Tab>('Beats')
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [beats, setBeats] = useState<BeatTrack[]>([])
  const [selectedTrack, setSelectedTrack] = useState<BeatTrack | null>(null)

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
      <NavBar selectedTab='studio' />

      <div className='relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-24 pb-16 sm:px-6'>
        {/* HEADER */}
        <header className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='font-mono text-xs tracking-[0.35em] text-gray-400 uppercase sm:text-sm'>
            GameOver Studio
          </h1>
          <span className='text-xs tracking-[0.2em] text-gray-500 uppercase'>
            Trap / Drill / Afro / Experimental
          </span>
        </header>

        <FeaturedBeatCard />

        {/* NOW PLAYING + SIDE INFO */}
        <section className='grid gap-6 md:grid-cols-[2fr,1fr]'>
          <div className='rounded-3xl border border-white/10 bg-white/5 p-5'>
            <span className='text-xs tracking-[0.2em] text-gray-400 uppercase'>
              Session summary
            </span>
            <div className='mt-3 flex flex-col gap-2 text-sm text-gray-300'>
              <span>0 beats loaded</span>
              <span>{playlists.length} playlists connected</span>
              <span className='text-gray-500'>
                Once you hook Spotify + your beat data, show stats here.
              </span>
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
                    <span className='absolute right-0 -bottom-[3px] left-0 mx-auto h-[2px] w-full max-w-[72px] rounded-full bg-cyan-400' />
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
      <PlayerBar
        track={selectedTrack}
        queue={beats}
        onTrackChange={track => setSelectedTrack(track as BeatTrack)}
      />
    </main>
  )
}
