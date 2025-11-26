'use client'
import { Track } from '@/app/models/Track'
import { createContext, useState } from 'react'
import { getBeatSignedUrl } from '../api'

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

  const setTrack = async (track: Track | null) => {
    await getBeatSignedUrl(track?.id ?? '').then(url => {
      setSelectedTrack({ ...track, audioUrl: url } as Track)
    })
  }

  const setQueue = (track: Track, tracks: Track[]) => {
    setCurrentIndex(tracks.findIndex(t => t.id === track.id))
    setQueueState(tracks ?? [])
  }

  const setPlayPause = (value: boolean) => {
    setIsPlaying(value)
  }

  const onNext = async () => {
    if (queue && currentIndex < queue.length - 1) {
      const newIndex = currentIndex + 1
      const nextTrack = queue[newIndex]
      setCurrentIndex(newIndex)
      await setTrack(nextTrack)
    }
  }

  const onPrev = async () => {
    if (queue && currentIndex > 0) {
      const newIndex = currentIndex - 1
      const prevTrack = queue[newIndex]
      setCurrentIndex(newIndex)
      await setTrack(prevTrack)
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
