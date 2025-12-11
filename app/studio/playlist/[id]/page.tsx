'use client'

import { useEffect, useState, useContext } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { NavBar } from '@/app/components/NavBar'
import Aurora from '@/app/components/Aurora'
import { SiSoundcloud } from 'react-icons/si'
import {
  HiPlay,
  HiPause,
  HiArrowLeft,
  HiMusicalNote,
  HiClock
} from 'react-icons/hi2'
import { getBeats } from '@/app/api'
import { PlayBarContext } from '@/app/providers/PlayBarProvider'
import { BeatTrack } from '@/app/models/Track'
import beatsPlaylistsData from '@/app/api/beats/playlists.json'

interface BeatsPlaylist {
  name: string
  description: string
  id: string
  images: string[]
  trackIds: string[]
}

export default function BeatsPlaylistPage() {
  const searchParams = useParams()
  const router = useRouter()

  const { setQueue, setTrack, setPlayPause, selectedTrack, isPlaying } =
    useContext(PlayBarContext)
  const [playlist, setPlaylist] = useState<BeatsPlaylist | null>(null)
  const [playlistBeats, setPlaylistBeats] = useState<BeatTrack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const playlistId = searchParams.id as string
    const foundPlaylist = beatsPlaylistsData.find(
      p => p.name.toLowerCase() === playlistId
    )

    if (!foundPlaylist) {
      setLoading(false)
      return
    }

    setPlaylist(foundPlaylist as BeatsPlaylist)

    getBeats()
      .then(allBeats => {
        const filteredBeats = allBeats.filter(beat =>
          foundPlaylist.trackIds.includes(beat.id)
        )

        const sortedBeats = foundPlaylist.trackIds
          .map(id => filteredBeats.find(beat => beat.id === id))
          .filter(Boolean) as BeatTrack[]

        setPlaylistBeats(sortedBeats)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching beats:', error)
        setLoading(false)
      })
  }, [searchParams.id])

  const isPlaylistPlaying =
    playlistBeats.some(beat => beat.id === selectedTrack?.id) && isPlaying

  const handlePlayPlaylist = async () => {
    if (isPlaylistPlaying) {
      setPlayPause(false)
    } else {
      const firstBeat = playlistBeats[0]
      if (!firstBeat) return

      await setTrack(firstBeat)
      setQueue(firstBeat, playlistBeats)
      setPlayPause(true)
    }
  }

  const handlePlayBeat = async (beat: BeatTrack, index: number) => {
    if (isPlaying && selectedTrack?.id === beat.id) {
      setPlayPause(false)
    } else if (selectedTrack?.id === beat.id) {
      setPlayPause(true)
    } else {
      await setTrack(beat)
      setQueue(beat, playlistBeats)
      setPlayPause(true)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatTotalDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`
  }

  // Calculate stats
  const totalDuration = playlistBeats.reduce(
    (acc, beat) => acc + (beat.duration_ms || 180000),
    0
  )
  const avgBpm = playlistBeats.length
    ? Math.round(
        playlistBeats.reduce((acc, beat) => acc + beat.bpm, 0) /
          playlistBeats.length
      )
    : 0
  const genres = [...new Set(playlistBeats.map(beat => beat.genre))]
  const moods = [
    ...new Set(playlistBeats.map(beat => beat.mood).filter(Boolean))
  ]

  if (loading) {
    return (
      <main className='relative min-h-screen bg-[#07050A] text-white'>
        <div className='pointer-events-none fixed inset-0 opacity-30'>
          <Aurora
            colorStops={['#00d4ff', '#0ea5e9', '#3b82f6']}
            amplitude={1.3}
            blend={0.7}
            speed={0.35}
          />
        </div>
        <NavBar selectedTab='studio' />
        <div className='flex h-screen items-center justify-center'>
          <div className='h-16 w-16 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-500' />
        </div>
      </main>
    )
  }

  if (!playlist) {
    return (
      <main className='relative min-h-screen bg-[#07050A] text-white'>
        <div className='pointer-events-none fixed inset-0 opacity-30'>
          <Aurora
            colorStops={['#00d4ff', '#0ea5e9', '#3b82f6']}
            amplitude={1.3}
            blend={0.7}
            speed={0.35}
          />
        </div>
        <NavBar selectedTab='studio' />
        <div className='flex h-screen items-center justify-center'>
          <div className='text-center'>
            <HiMusicalNote className='mx-auto mb-4 text-gray-600' size={64} />
            <p className='text-xl text-gray-400'>Playlist not found</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='relative min-h-screen bg-[#07050A] text-white'>
      <div className='pointer-events-none fixed inset-0 opacity-30'>
        <Aurora
          colorStops={['#00d4ff', '#0ea5e9', '#3b82f6']}
          amplitude={1.3}
          blend={0.7}
          speed={0.35}
        />
      </div>

      <NavBar selectedTab='studio' />

      <div className='relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6'>
        <button
          onClick={() => router.back()}
          className='mb-6 flex items-center gap-2 text-gray-400 transition-colors hover:text-white'
        >
          <HiArrowLeft size={20} />
          <span>Back to Studio</span>
        </button>

        {/* Playlist Header */}
        <section className='mb-12'>
          <div className='flex flex-col gap-8 md:flex-row md:items-end'>
            {/* Playlist Cover - Dynamic Gradient */}
            <div className='relative h-64 w-64 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-cyan-500/20'>
              <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500 via-blue-500 to-fuchsia-600'>
                <div className='text-center'>
                  <HiMusicalNote size={96} className='mx-auto text-white/90' />
                  <div className='mt-4 font-mono text-sm tracking-[0.2em] text-white/70'>
                    {playlistBeats.length} BEATS
                  </div>
                </div>
              </div>
            </div>

            {/* Playlist Info */}
            <div className='flex flex-col gap-4'>
              <span className='font-mono text-xs tracking-[0.35em] text-cyan-400 uppercase'>
                Beat Collection
              </span>
              <h1 className='text-4xl font-bold text-white sm:text-5xl lg:text-6xl'>
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className='max-w-2xl text-gray-300'>
                  {playlist.description}
                </p>
              )}
              <div className='flex flex-wrap items-center gap-2 text-sm text-gray-400'>
                <span className='font-semibold text-white'>GameOver</span>
                <span>•</span>
                <span>{playlistBeats.length} beats</span>
                <span>•</span>
                <span>{formatTotalDuration(totalDuration)}</span>
              </div>

              {/* Actions */}
              <div className='mt-4 flex flex-wrap items-center gap-4'>
                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayPlaylist}
                  className='group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 hover:shadow-cyan-500/40'
                >
                  {isPlaylistPlaying ? (
                    <HiPause size={24} className='text-white' />
                  ) : (
                    <HiPlay size={24} className='ml-1 text-white' />
                  )}
                </button>

                <a
                  href='https://soundcloud.com/goproductions'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10'
                >
                  <SiSoundcloud size={20} />
                  Open on SoundCloud
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Playlist Stats */}
        <section className='mb-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4'>
          {/* Avg BPM */}
          <div className='rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
            <div className='mb-2 text-xs tracking-[0.2em] text-gray-400 uppercase'>
              Avg BPM
            </div>
            <div className='text-2xl font-bold text-cyan-400'>{avgBpm}</div>
          </div>

          {/* Genres */}
          <div className='rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
            <div className='mb-2 text-xs tracking-[0.2em] text-gray-400 uppercase'>
              Genres
            </div>
            <div className='flex flex-wrap gap-1'>
              {genres.slice(0, 2).map(genre => (
                <span
                  key={genre}
                  className='rounded-full border border-white/20 bg-white/5 px-2 py-1 text-xs text-white'
                >
                  {genre}
                </span>
              ))}
              {genres.length > 2 && (
                <span className='rounded-full border border-white/20 bg-white/5 px-2 py-1 text-xs text-gray-400'>
                  +{genres.length - 2}
                </span>
              )}
            </div>
          </div>

          {/* Moods */}
          <div className='rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
            <div className='mb-2 text-xs tracking-[0.2em] text-gray-400 uppercase'>
              Vibes
            </div>
            <div className='flex flex-wrap gap-1'>
              {moods.slice(0, 2).map(mood => (
                <span
                  key={mood}
                  className='rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2 py-1 text-xs text-fuchsia-300'
                >
                  {mood}
                </span>
              ))}
              {moods.length > 2 && (
                <span className='rounded-full border border-white/20 bg-white/5 px-2 py-1 text-xs text-gray-400'>
                  +{moods.length - 2}
                </span>
              )}
            </div>
          </div>

          {/* Total Beats */}
          <div className='rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
            <div className='mb-2 text-xs tracking-[0.2em] text-gray-400 uppercase'>
              Total Beats
            </div>
            <div className='text-2xl font-bold text-white'>
              {playlistBeats.length}
            </div>
          </div>
        </section>

        {/* Beats List */}
        <section className='mb-30'>
          <div className='mb-4 grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b border-white/10 px-4 pb-2 text-sm font-semibold text-gray-400'>
            <div className='text-center'>#</div>
            <div>Title</div>
            <div className='hidden sm:block'>BPM</div>
            <div className='hidden md:block'>Mood</div>
            <div className='flex items-center justify-end'>
              <HiClock size={18} />
            </div>
          </div>

          <div className='space-y-1'>
            {playlistBeats.map((beat, index) => {
              const isCurrentBeat = selectedTrack?.id === beat.id
              const beatIsPlaying = isCurrentBeat && isPlaying

              return (
                <div
                  key={beat.id}
                  onClick={() => handlePlayBeat(beat, index)}
                  className={`group grid cursor-pointer grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 rounded-lg px-4 py-3 transition-all hover:bg-white/5 ${
                    isCurrentBeat ? 'bg-white/10' : ''
                  }`}
                >
                  {/* Beat Number / Play Button */}
                  <div className='relative flex h-10 w-10 items-center justify-center'>
                    <span
                      className={`text-sm ${
                        isCurrentBeat
                          ? 'text-cyan-400'
                          : 'text-gray-400 group-hover:hidden'
                      } ${beatIsPlaying ? 'hidden' : ''}`}
                    >
                      {index + 1}
                    </span>
                    <div
                      className={`${
                        beatIsPlaying ? 'flex' : 'hidden'
                      } items-center justify-center group-hover:flex`}
                    >
                      {beatIsPlaying ? (
                        <HiPause size={20} className='text-cyan-400' />
                      ) : (
                        <HiPlay
                          size={20}
                          className={
                            isCurrentBeat ? 'text-cyan-400' : 'text-white'
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* Beat Info */}
                  <div className='min-w-0'>
                    <div
                      className={`truncate font-semibold ${
                        isCurrentBeat ? 'text-cyan-400' : 'text-white'
                      }`}
                    >
                      {beat.title}
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-400'>
                      <span>{beat.genre}</span>
                      {beat.key && (
                        <>
                          <span>•</span>
                          <span>{beat.key}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* BPM */}
                  <div className='hidden text-sm text-gray-400 sm:block'>
                    <span
                      className={`rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs ${
                        isCurrentBeat
                          ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-400'
                          : ''
                      }`}
                    >
                      {beat.bpm} BPM
                    </span>
                  </div>

                  {/* Mood */}
                  <div className='hidden min-w-0 text-sm text-gray-400 md:block'>
                    {beat.mood && (
                      <span className='rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-300'>
                        {beat.mood}
                      </span>
                    )}
                  </div>

                  {/* Duration */}
                  <div className='flex items-center justify-end text-sm text-gray-400'>
                    <span>{formatDuration(beat.duration_ms || 180000)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
