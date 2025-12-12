'use client'

import { useEffect, useRef, useContext } from 'react'
import { getSpotifyAccessToken } from '../api'
import { SpotifyTrack, Track } from '../models/Track'

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void
    Spotify?: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifyPlayer
    }
    spotifyPlayerInstance?: SpotifyPlayer
  }
}

interface SpotifyPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, callback: (data: any) => void): void
  removeListener(event: string): void
  getCurrentState(): Promise<any>
  setName(name: string): Promise<void>
  getVolume(): Promise<number>
  setVolume(volume: number): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  togglePlay(): Promise<void>
  seek(position_ms: number): Promise<void>
  previousTrack(): Promise<void>
  nextTrack(): Promise<void>
  deviceId: string
}

export function useSpotifyPlayer({
  isLoggedIn,
  setTrack,
  setPlayPause,
  selectedTrack
}: {
  isLoggedIn: boolean
  setTrack: (track: Track) => {}
  setPlayPause: (value: boolean) => void
  selectedTrack: Track | null
}) {
  const currentTrackIdRef = useRef<string | null>(null)
  const isUpdatingRef = useRef(false)
  const isSpotifyAudioSource = useRef(false)

  useEffect(() => {
    currentTrackIdRef.current = selectedTrack?.id || null
    if (selectedTrack?.source === 'beat') {
      isSpotifyAudioSource.current = false
    } else if (selectedTrack?.source === 'spotify') {
      isSpotifyAudioSource.current = true
    }
  }, [selectedTrack])

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    if (window.spotifyPlayerInstance) {
      console.log('✅ Spotify player already initialized, skipping')
      return
    }

    console.log('🔧 Setting up Spotify Player...')

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('✅ Spotify SDK Ready callback triggered')

      // ✅ Double-check in callback
      if (window.spotifyPlayerInstance) {
        console.log('Player already initialized in callback, skipping')
        return
      }

      if (!window.Spotify) {
        console.error('Spotify SDK not available')
        return
      }

      console.log('🎵 Initializing Spotify Player...')

      const player = new window.Spotify.Player({
        name: 'GameOver Studio',
        getOAuthToken: async cb => {
          const accessToken = await getSpotifyAccessToken()
          if (!accessToken) {
            console.error('No access token available')
            return
          }
          cb(accessToken)
        },
        volume: 0.5
      })

      player.addListener('ready', ({ device_id }) => {
        console.log('✅ Spotify Player Ready with Device ID:', device_id)
        if (!window.spotifyPlayerInstance) return
        window.spotifyPlayerInstance!.deviceId = device_id
      })

      player.addListener('not_ready', ({ device_id }) => {
        console.log('⚠️ Device ID has gone offline:', device_id)
      })

      player.addListener('initialization_error', ({ message }) => {
        console.error('❌ Initialization error:', message)
      })

      player.addListener('authentication_error', ({ message }) => {
        console.error('❌ Authentication error:', message)
        window.spotifyPlayerInstance = undefined
      })

      player.addListener('account_error', ({ message }) => {
        console.error('❌ Account error:', message)
      })

      player.addListener('playback_error', ({ message }) => {
        console.error('❌ Playback error:', message)
      })

      player.addListener('player_state_changed', async state => {
        if (!isSpotifyAudioSource) return
        if (!state || isUpdatingRef.current) return
        console.log('🔄 Spotify player state changed event received')

        const currentTrack = state.track_window.current_track
        const isPaused = state.paused

        console.log('🎵 Player state:', currentTrack.name, 'Paused:', isPaused)

        setPlayPause(!isPaused)
        updateMediaSession(currentTrack)

        if (currentTrackIdRef.current === currentTrack.id) {
          return
        }

        console.log('📀 New track detected:', currentTrack.name)

        isUpdatingRef.current = true

        try {
          const track = new SpotifyTrack({
            id: currentTrack.id,
            name: currentTrack.name,
            title: currentTrack.name,
            artists: currentTrack.artists,
            album: currentTrack.album,
            duration_ms: currentTrack.durationMs,
            audioUrl: currentTrack.uri,
            mediaType: currentTrack.mediaType,
            source: 'spotify'
          })

          setTrack(track)
        } finally {
          isUpdatingRef.current = false
        }
      })

      player.connect().then(success => {
        if (success) {
          console.log('🎵 Spotify Player connected successfully!')
          window.spotifyPlayerInstance = player
        } else {
          console.error('Failed to connect Spotify Player')
        }
      })
    }

    if (!document.getElementById('spotify-player-sdk')) {
      console.log('📦 Loading Spotify SDK...')
      const script = document.createElement('script')
      script.id = 'spotify-player-sdk'
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true

      script.onload = () => {
        console.log('✅ Spotify SDK script loaded')
      }

      script.onerror = () => {
        console.error('❌ Failed to load Spotify SDK')
      }

      document.body.appendChild(script)
    } else {
      console.log('✅ Spotify SDK already loaded')
      if (window.Spotify && !window.spotifyPlayerInstance) {
        window.onSpotifyWebPlaybackSDKReady?.()
      }
    }

    return () => {}
  }, [isLoggedIn, setTrack, setPlayPause])
}

function updateMediaSession(track: any) {
  if (!('mediaSession' in navigator)) return

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.name || 'Unknown Track',
    artist:
      track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
    album: track.album?.name || 'Unknown Album',
    artwork:
      track.album?.images?.map((img: any) => ({
        src: img.url,
        sizes: `${img.width}x${img.height}`,
        type: 'image/jpeg'
      })) || []
  })
}
