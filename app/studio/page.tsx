'use client'
import { SetStateAction, useEffect, useState } from 'react'
import Aurora from '../components/Aurora'
import { NavBar } from '../components/NavBar'
import { useRouter } from 'next/navigation'
import FeaturedBeatCard from '../components/FeaturedBeatCard'
import { PlayerBar } from '../components/PlayerBar'
import { getPlaylists } from '../api'
import { HiPlay } from 'react-icons/hi2'
import { Playlist } from '../models/Playlist'

const tabs = ['Beats', 'Playlists'] as const
type Tab = (typeof tabs)[number]

export default function Studio() {
  const [activeTab, setActiveTab] = useState<Tab>('Beats')
  const [playlists, setPlaylists] = useState<Playlist[]>([])

  useEffect(() => {
    getPlaylists()
      .then((data: Playlist[]) => {
        console.log('Playlists in Studio:', data)
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
    <main className='relative min-h-screen bg-[#07050A] text-white'>
      {/* optional aurora / background */}
      {/* <Aurora
        colorStops={['#3A29FF', '#FF94B4', '#FF3232']}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      /> */}

      <NavBar selectedTab='studio' />

      <div className='animate-studioEnter relative mx-auto flex max-w-6xl translate-y-4 flex-col gap-8 px-6 pt-24 pb-16 opacity-0'>
        {/* HEADER */}
        <header className='flex items-center justify-between'>
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
          {/* right-side info box */}
          <div className='bg-white/5/5 rounded-3xl border border-white/5 bg-gradient-to-br from-purple-500/10 via-white/0 to-cyan-500/5 p-5 backdrop-blur-lg'>
            <span className='text-xs tracking-[0.2em] text-gray-400 uppercase'>
              Session summary
            </span>
            <div className='mt-3 flex flex-col gap-2 text-sm text-gray-300'>
              <span>0 beats loaded</span>
              <span>0 playlists connected</span>
              <span className='text-gray-500'>
                Once you hook Spotify + your beat data, show stats here.
              </span>
            </div>
          </div>
        </section>

        {/* TABS */}
        <section className='mt-2 flex items-center justify-between border-b border-white/5 pb-2'>
          <div className='flex gap-4 text-sm'>
            {tabs.map(tab => {
              const isActive = tab === activeTab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-2 tracking-[0.18em] uppercase ${
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

          {/* future sort/filter */}
          <div className='text-xs tracking-[0.18em] text-gray-500 uppercase'>
            {/* placeholder */}
            Vibe · BPM · Energy
          </div>
        </section>

        {/* CONTENT GRID / LIST */}
        <section className='mt-2'>
          {activeTab === 'Beats' ? (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {/* placeholder beat cards */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className='group bg-white/5/5 flex cursor-pointer flex-col justify-between rounded-2xl border border-white/5 p-4 backdrop-blur-lg transition hover:border-cyan-400/60 hover:bg-white/10'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm font-semibold'>
                        Beat #{i + 1}
                      </span>
                      <span className='text-xs text-gray-400'>
                        Trap · 140 BPM · Dark
                      </span>
                    </div>
                    <button className='flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-black transition group-hover:scale-[1.05]'>
                      <HiPlay size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {/* placeholder playlist cards */}
              {playlists.map((playlist, i) => (
                <div
                  key={playlist.id}
                  className='bg-white/5/5 flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/5 p-4 backdrop-blur-lg transition hover:border-fuchsia-400/60 hover:bg-white/10'
                >
                  <div className='h-24 w-full rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500' />
                  <div className='flex flex-col gap-1'>
                    <span className='text-sm font-semibold'>
                      Playlist #{i + 1}
                    </span>
                    <span className='text-xs text-gray-400'>
                      Spotify · Vibe session
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <PlayerBar
        // title={currentTrack?.title}
        // subtitle={
        //   currentTrack
        //     ? `${currentTrack.genre} · ${currentTrack.bpm} BPM`
        //     : undefined
        // }
        isPlaying={true}
      />
    </main>
  )
}
