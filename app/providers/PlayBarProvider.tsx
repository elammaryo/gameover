'use client'
import { Track, SpotifyTrack } from '@/app/models/Track'
import { createContext, useEffect, useState } from 'react'
import { getBeatSignedUrl } from '../api'
import { useSpotifyPlayer } from '../components/useSpotifyPlayer'

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
  const [loggedIn, setLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    const isLoggedIn = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('spotify_logged_in='))
      ?.split('=')[1]

    setLoggedIn(!!isLoggedIn)
  }, [])

  const setTrack = async (track: Track | null) => {
    if (!track) {
      setSelectedTrack(null)
      return
    }

    if (track.source === 'beat') {
      if (window.spotifyPlayerInstance && selectedTrack?.source === 'spotify') {
        try {
          await window.spotifyPlayerInstance.pause()
          setIsPlaying(false)
        } catch (error) {
          console.error('Error pausing Spotify track:', error)
        }
      }
      const cached = urlCache.get(track.id)
      const now = Date.now()
      let audioUrl: string

      if (cached && cached.expiresAt > now) {
        audioUrl = cached.url
      } else {
        const url = await getBeatSignedUrl(track.id)
        const expiresAt = now + 55 * 60 * 1000
        audioUrl = url
        setUrlCache(prev => new Map(prev).set(track.id, { url, expiresAt }))
      }

      setSelectedTrack({ ...track, audioUrl })
      setIsPlaying(true)
    } else if (track.source === 'spotify') {
      if (!window.spotifyPlayerInstance) {
        console.error('Spotify player not ready')
        return
      }

      try {
        if (track !== selectedTrack) {
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
      try {
        if (value) {
          window.spotifyPlayerInstance?.resume()
        } else {
          window.spotifyPlayerInstance?.pause()
        }
      } catch (error) {
        console.error('Error setting Spotify play/pause:', error)
        setIsPlaying(false)
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

  useSpotifyPlayer({
    isLoggedIn: !!loggedIn,
    setTrack,
    setPlayPause,
    selectedTrack
  })

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
