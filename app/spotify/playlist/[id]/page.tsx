'use client'

import { useEffect, useState, useContext } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { NavBar } from '@/app/components/NavBar'
import Aurora from '@/app/components/Aurora'
import { SiSpotify } from 'react-icons/si'
import {
  HiPlay,
  HiPause,
  HiArrowLeft,
  HiClock,
  HiMusicalNote
} from 'react-icons/hi2'
import { getPlaylistTracks, playSpotifyTrack } from '@/app/api'
import { Playlist } from '@/app/models/Playlist'
import { PlayBarContext } from '@/app/providers/PlayBarProvider'
import { SpotifyTrack } from '@/app/models/Track'

export default function PlaylistDetailPage() {
  const searchParams = useParams()
  const router = useRouter()

  const { setQueue, setTrack, setPlayPause, selectedTrack, isPlaying } =
    useContext(PlayBarContext)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const playlistId = searchParams.id as string

    getPlaylistTracks(playlistId)
      .then(playlist => {
        setPlaylist(playlist)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching playlist:', error)
        setLoading(false)
      })
  }, [])

  const playlistTracks = playlist?.tracks.items || []

  const isPlaylistPlaying =
    playlistTracks.some(item => item.track.id === selectedTrack?.id) &&
    isPlaying

  const handlePlayPlaylist = () => {
    if (isPlaylistPlaying) {
      setPlayPause(false)
    } else {
      const firstTrack = playlistTracks[0]?.track
      if (!firstTrack || !playlist) return

      playSpotifyTrack({
        contextUri: playlist.uri,
        offset: 0
      })

      setTrack(new SpotifyTrack({ ...firstTrack, title: firstTrack.name }))
      setQueue(
        new SpotifyTrack({ ...firstTrack, title: firstTrack.name }),
        playlistTracks.map(
          item => new SpotifyTrack({ ...item.track, title: item.track.name })
        )
      )
    }
  }

  const handlePlayTrack = (track: SpotifyTrack, index: number) => {
    if (isPlaying && selectedTrack?.id === track.id) {
      setPlayPause(false)
    } else if (selectedTrack?.id === track.id) {
      setPlayPause(true)
    } else {
      playSpotifyTrack({
        contextUri: playlist?.uri,
        offset: index
      })

      setTrack(new SpotifyTrack({ ...track, title: track.name }))
      setQueue(
        track,
        playlistTracks.map(
          item => new SpotifyTrack({ ...item.track, title: item.track.name })
        )
      )
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

  if (loading) {
    return (
      <main className='relative min-h-screen bg-[#07050A] text-white'>
        <div className='pointer-events-none fixed inset-0 opacity-40'>
          <Aurora
            colorStops={['#1DB954', '#1ed760', '#00ff7f']}
            amplitude={1.3}
            blend={0.7}
            speed={0.35}
          />
        </div>
        <NavBar selectedTab='spotify' />
        <div className='flex h-screen items-center justify-center'>
          <div className='h-16 w-16 animate-spin rounded-full border-4 border-green-500/20 border-t-green-500' />
        </div>
      </main>
    )
  }

  if (!playlist) {
    return (
      <main className='relative min-h-screen bg-[#07050A] text-white'>
        <NavBar selectedTab='spotify' />
        <div className='flex h-screen items-center justify-center'>
          <div className='text-center'>
            <SiSpotify className='mx-auto mb-4 text-gray-600' size={64} />
            <p className='text-xl text-gray-400'>Playlist not found</p>
          </div>
        </div>
      </main>
    )
  }

  const totalDuration = (playlist.tracks.items ?? []).reduce(
    (acc, item) => acc + (item.track.duration_ms || 0),
    0
  )

  return (
    <main className='relative min-h-screen bg-[#07050A] text-white'>
      <div className='pointer-events-none fixed inset-0 opacity-40'>
        <Aurora
          colorStops={['#1DB954', '#1ed760', '#00ff7f']}
          amplitude={1.3}
          blend={0.7}
          speed={0.35}
        />
      </div>

      <NavBar selectedTab='spotify' />

      <div className='relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6'>
        <button
          onClick={() => router.back()}
          className='mb-6 flex items-center gap-2 text-gray-400 transition-colors hover:text-white'
        >
          <HiArrowLeft size={20} />
          <span>Back to Playlists</span>
        </button>

        {/* Playlist Header */}
        <section className='mb-12'>
          <div className='flex flex-col gap-8 md:flex-row md:items-end'>
            {/* Playlist Cover */}
            <div className='relative h-64 w-64 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-green-500/20'>
              {playlist.images && playlist?.images[0]?.url ? (
                <Image
                  src={playlist.images[0].url}
                  alt={playlist.name ?? 'Playlist Cover'}
                  width={256}
                  height={256}
                  className='h-full w-full object-cover'
                  priority
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600'>
                  <HiMusicalNote size={96} className='text-white/50' />
                </div>
              )}
            </div>

            {/* Playlist Info */}
            <div className='flex flex-col gap-4'>
              <span className='font-mono text-xs tracking-[0.35em] text-green-400 uppercase'>
                Playlist
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
                <span className='font-semibold text-white'>
                  {playlist.owner?.displayName ?? 'N/A'}
                </span>
                <span>•</span>
                <span>{playlist.tracks?.total} songs</span>
                <span>•</span>
                <span>{formatTotalDuration(totalDuration)}</span>
              </div>

              {/* Actions */}
              <div className='mt-4 flex flex-wrap items-center gap-4'>
                {/* ✅ Play/Pause Playlist Button */}
                <button
                  onClick={handlePlayPlaylist}
                  className='group flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/25 transition-all hover:scale-105 hover:bg-green-400'
                >
                  {isPlaylistPlaying ? (
                    <HiPause size={24} className='text-black' />
                  ) : (
                    <HiPlay size={24} className='ml-1 text-black' />
                  )}
                </button>

                <a
                  href={playlist.external_urls?.spotify}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10'
                >
                  <SiSpotify size={20} />
                  Open in Spotify
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Tracks List */}
        <section className='mb-30'>
          <div className='mb-4 grid grid-cols-[auto_1fr_1fr_auto] gap-4 border-b border-white/10 px-4 pb-2 text-sm font-semibold text-gray-400'>
            <div className='text-center'>#</div>
            <div>Title</div>
            <div className='hidden md:block'>Album</div>
            <div className='flex items-center justify-end'>
              <HiClock size={18} />
            </div>
          </div>

          <div className='space-y-1'>
            {playlistTracks.map((item, index) => {
              if (!item) return null
              const track = item.track
              const isCurrentTrack = selectedTrack?.id === track.id
              const trackIsPlaying = isCurrentTrack && isPlaying

              return (
                <div
                  key={track.id}
                  onClick={() => handlePlayTrack(track, index)}
                  className={`group grid cursor-pointer grid-cols-[auto_1fr_1fr_auto] items-center gap-4 rounded-lg px-4 py-3 transition-all hover:bg-white/5 ${
                    isCurrentTrack ? 'bg-white/10' : ''
                  }`}
                >
                  {/* Track Number / Play Button */}
                  <div className='relative flex h-10 w-10 items-center justify-center'>
                    <span
                      className={`text-sm ${
                        isCurrentTrack
                          ? 'text-green-400'
                          : 'text-gray-400 group-hover:hidden'
                      } ${trackIsPlaying ? 'hidden' : ''}`}
                    >
                      {index + 1}
                    </span>
                    <div
                      className={`${
                        trackIsPlaying ? 'flex' : 'hidden'
                      } items-center justify-center group-hover:flex`}
                    >
                      {trackIsPlaying ? (
                        <HiPause size={20} className='text-green-400' />
                      ) : (
                        <HiPlay
                          size={20}
                          className={
                            isCurrentTrack ? 'text-green-400' : 'text-white'
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className='flex min-w-0 items-center gap-3'>
                    <div className='relative h-12 w-12 flex-shrink-0 overflow-hidden rounded'>
                      {track.album.images[0]?.url ? (
                        <Image
                          src={track.album.images[0].url}
                          alt={track.album.name ?? 'Album Cover'}
                          width={48}
                          height={48}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <div className='h-full w-full bg-white/5' />
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div
                        className={`truncate font-semibold ${
                          isCurrentTrack ? 'text-green-400' : 'text-white'
                        }`}
                      >
                        {track.name}
                      </div>
                      <div className='truncate text-sm text-gray-400'>
                        {track.artists
                          .map((artist: { name: string }) => artist.name)
                          .join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Album Name */}
                  <div className='hidden min-w-0 truncate text-sm text-gray-400 md:block'>
                    {track.album.name}
                  </div>

                  {/* Duration */}
                  <div className='flex items-center justify-end text-sm text-gray-400'>
                    <span>{formatDuration(track.duration_ms ?? 0)}</span>
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
