'use client'
import { Track } from '@/app/models/Track'
import { createContext, useState } from 'react'
import { getBeatSignedUrl } from '../api'

export const PlayBarContext = createContext({
  selectedTrack: null as Track | null,
  setTrack: async (track: Track | null) => {},
  setQueue: (tracks: Track[]) => {},
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

  const setTrack = async (track: Track | null) => {
    await getBeatSignedUrl(track?.id ?? '').then(url => {
      setSelectedTrack({ ...track, audioUrl: url } as Track)
    })
  }

  const setQueue = (tracks: Track[]) => {
    setQueueState(tracks ?? [])
  }

  const setPlayPause = (value: boolean) => {
    setIsPlaying(value)
  }

  const onNext = async () => {
    if (!queue || !selectedTrack) return
    const currentIndex = queue.findIndex(t => t.id === selectedTrack.id)
    if (currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1]
      await setTrack(nextTrack)
    }
  }

  const onPrev = async () => {
    if (!queue || !selectedTrack) return
    const currentIndex = queue.findIndex(t => t.id === selectedTrack.id)
    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1]
      await setTrack(prevTrack)
    }
  }

  return (
    <>
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
    </>
  )
}
