'use client'
import { Track } from '@/app/models/Track'
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
    if (track?.source === 'beat') {
      if (!track?.id) {
        setSelectedTrack(null)
        return
      }

      const cached = urlCache.get(track.id)
      const now = Date.now()

      // Check if cached URL exists and hasn't expired
      if (cached && cached.expiresAt > now) {
        setSelectedTrack({ ...track, audioUrl: cached.url } as Track)
      } else {
        const url = await getBeatSignedUrl(track.id)

        // We use 55 min instead of 60 to ensure it doesn't expire mid-playback
        const expiresAt = now + 55 * 60 * 1000

        setUrlCache(prev => new Map(prev).set(track.id, { url, expiresAt }))
        setSelectedTrack({ ...track, audioUrl: url } as Track)
      }
    } else {
      setSelectedTrack(track)
    }
  }

  const setQueue = (track: Track, tracks: Track[]) => {
    setCurrentIndex(tracks.findIndex(t => t.id === track.id))
    setQueueState(tracks ?? [])
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
      if (queue && currentIndex < queue.length - 1) {
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
      return
    } else {
      if (queue && currentIndex > 0) {
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
