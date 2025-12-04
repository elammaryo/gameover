'use client'
import { Track, SpotifyTrack } from '@/app/models/Track'
import { createContext, useState } from 'react'
import { getBeatSignedUrl } from '../api'

interface CachedUrl {
  url: string
  expiresAt: number
}

export const PlayBarContext = createContext({
  selectedTrack: null as Track | null,
  setTrack: async (track: Track | null) => {},
  setQueue: (track: Track, tracks: Track[]) => {},
  queue: [] as Track[],
  onNext: async () => {},
  onPrev: async () => {},
  isPlaying: false,
  setPlayPause: (value: boolean) => {}
})

export default function PlayBarProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [queue, setQueueState] = useState<Track[]>([])
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [urlCache, setUrlCache] = useState<Map<string, CachedUrl>>(new Map())

  const setTrack = async (track: Track | null) => {
    if (!track) {
      setSelectedTrack(null)
      return
    }

    if (track.source === 'beat') {
      if (window.spotifyPlayerInstance) {
        await window.spotifyPlayerInstance.pause()
      }
      const cached = urlCache.get(track.id)
      const now = Date.now()

      if (cached && cached.expiresAt > now) {
        setSelectedTrack({ ...track, audioUrl: cached.url } as Track)
      } else {
        const url = await getBeatSignedUrl(track.id)
        const expiresAt = now + 55 * 60 * 1000
        setUrlCache(prev => new Map(prev).set(track.id, { url, expiresAt }))
        setSelectedTrack({ ...track, audioUrl: url } as Track)
      }
    } else if (track.source === 'spotify') {
      const spotifyTrack = track as SpotifyTrack

      if (!window.spotifyPlayerInstance) {
        console.error('Spotify player not ready')
        return
      }

      try {
        if (track !== selectedTrack) {
          console.log('Playing Spotify track:', spotifyTrack.name)
          setSelectedTrack(track)
          setIsPlaying(true)
        }
      } catch (error) {
        console.error('Error playing Spotify track:', error)
      }
    }
  }

  const setQueue = (track: Track, tracks: Track[]) => {
    const index = tracks.findIndex(t => t.id === track.id)
    setCurrentIndex(index)
    setQueueState(tracks)
  }

  const setPlayPause = (value: boolean) => {
    if (selectedTrack?.source === 'spotify') {
      if (value) {
        window.spotifyPlayerInstance?.resume()
      } else {
        window.spotifyPlayerInstance?.pause()
      }
    }
    setIsPlaying(value)
  }

  const onNext = async () => {
    if (selectedTrack?.source === 'spotify') {
      await window.spotifyPlayerInstance?.nextTrack()
    } else {
      if (queue.length && currentIndex < queue.length - 1) {
        const newIndex = currentIndex + 1
        const nextTrack = queue[newIndex]
        setCurrentIndex(newIndex)
        await setTrack(nextTrack)
      }
    }
  }

  const onPrev = async () => {
    if (selectedTrack?.source === 'spotify') {
      await window.spotifyPlayerInstance?.previousTrack()
    } else {
      if (queue.length && currentIndex > 0) {
        const newIndex = currentIndex - 1
        const prevTrack = queue[newIndex]
        setCurrentIndex(newIndex)
        await setTrack(prevTrack)
      }
    }
  }

  return (
    <PlayBarContext.Provider
      value={{
        selectedTrack,
        setTrack,
        setQueue,
        queue,
        onNext,
        onPrev,
        isPlaying,
        setPlayPause
      }}
    >
      {children}
    </PlayBarContext.Provider>
  )
}
