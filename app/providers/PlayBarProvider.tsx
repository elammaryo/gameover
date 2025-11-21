'use client'
import { Track } from '@/app/models/Track'
import { createContext, useState } from 'react'

export const PlayBarContext = createContext({
  selectedTrack: null as Track | null,
  setTrack: (track: Track) => {},
  setQueue: (tracks: Track[]) => {},
  onNext: () => {},
  onPrev: () => {}
})

export default function PlayBarProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [queue, setQueueState] = useState<Track[]>([])

  const setTrack = (track: Track) => {
    setSelectedTrack(track)
  }

  const setQueue = (tracks: Track[]) => {
    setQueueState(tracks)
  }

  const onNext = () => {
    if (!queue || !selectedTrack) return
    const currentIndex = queue.findIndex(t => t.id === selectedTrack.id)
    if (currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1]
      setSelectedTrack(nextTrack)
    }
  }

  const onPrev = () => {
    if (!queue || !selectedTrack) return
    const currentIndex = queue.findIndex(t => t.id === selectedTrack.id)
    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1]
      setSelectedTrack(prevTrack)
    }
  }

  return (
    <>
      <PlayBarContext.Provider
        value={{ selectedTrack, setTrack, setQueue, onNext, onPrev }}
      >
        {children}
      </PlayBarContext.Provider>
    </>
  )
}
