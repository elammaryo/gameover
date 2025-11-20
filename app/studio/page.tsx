'use client'
import { useEffect, useState } from 'react'
import Aurora from '../components/Aurora'
import { NavBar } from '../components/NavBar'
import FeaturedBeatCard from '../components/FeaturedBeatCard'
import { PlayerBar } from '../components/PlayerBar'
import { getBeats, getPlaylists } from '../api'
import { HiPlay } from 'react-icons/hi2'
import { Playlist } from '../models/Playlist'
import { get } from 'http'
import { BeatTrack } from '../models/Track'

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
    <main className='relative min-h-screen bg-[#07050A] text-white'>
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
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {beats.map(beat => (
                <div
                  key={beat.id}
                  className='group flex cursor-pointer flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-cyan-400/60 hover:bg-white/10'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm font-semibold'>
                        {beat.title}
                      </span>
                      <span className='text-xs text-gray-400'>
                        {beat.genre} · {beat.bpm} BPM · {beat.mood || 'Unknown'}
                      </span>
                    </div>
                    <button
                      className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-xs font-semibold text-black transition-transform group-hover:scale-105'
                      onClick={() => {
                        setSelectedTrack(beat)
                      }}
                    >
                      <HiPlay size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {playlists.map(playlist => (
                <button
                  key={playlist.id}
                  className='bg-white/5/5 flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/5 p-5 transition-colors hover:border-fuchsia-400/60 hover:bg-white/10'
                  onClick={() => {}}
                >
                  <div className='h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500'>
                    {playlist.images[0]?.url && (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className='h-full w-full object-cover'
                        loading='lazy'
                      />
                    )}
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex flex-col items-start gap-1'>
                      <span className='text-sm font-semibold'>
                        {playlist.name}
                      </span>
                      <span className='text-xs text-gray-400'>
                        Spotify · Vibe session
                      </span>
                    </div>
                    <div
                      className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-xs font-semibold text-black transition-transform hover:scale-108'
                      onClick={e => {
                        e.stopPropagation() // Prevent outer button click
                        // Handle play button click
                        console.log('Play playlist:', playlist.name)
                      }}
                    >
                      <HiPlay size={14} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
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
