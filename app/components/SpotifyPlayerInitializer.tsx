'use client'

import { useEffect, useRef } from 'react'

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
}

export function SpotifyPlayerInitializer({
  isLoggedIn
}: {
  isLoggedIn: boolean
}) {
  const playerInitialized = useRef(false)

  useEffect(() => {
    if (!isLoggedIn || playerInitialized.current) {
      return
    }

    if (window.spotifyPlayerInstance) {
      console.log('✅ Spotify player already exists, skipping initialization')
      playerInitialized.current = true
      return
    }

    console.log('🔧 Setting up Spotify Player...')

    // FIRST: Set up the callback BEFORE loading the script
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('✅ Spotify SDK Ready callback triggered')

      if (window.spotifyPlayerInstance) {
        console.log('Player already initialized in callback')
        return
      }

      if (!window.Spotify) {
        console.error('Spotify SDK not available')
        return
      }

      console.log('🎵 Initializing Spotify Player...')

      const player = new window.Spotify.Player({
        name: 'GameOver Studio Player',
        getOAuthToken: cb => {
          const currentToken =
            document.cookie
              .split(';')
              .find(c => c.trim().startsWith('spotify_access_token='))
              ?.split('=')[1] || ''

          cb(currentToken)
        },
        volume: 0.5
      })

      player.addListener('ready', ({ device_id }) => {
        console.log('✅ Spotify Player Ready with Device ID:', device_id)
      })

      player.addListener('not_ready', ({ device_id }) => {
        console.log('⚠️ Device ID has gone offline:', device_id)
      })

      player.addListener('initialization_error', ({ message }) => {
        console.error('❌ Initialization error:', message)
      })

      player.addListener('authentication_error', ({ message }) => {
        console.error('❌ Authentication error:', message)
        document.cookie = 'spotify_access_token=; Max-Age=0; path=/'
        window.spotifyPlayerInstance = undefined
        playerInitialized.current = false
      })

      player.addListener('account_error', ({ message }) => {
        console.error('❌ Account error:', message)
      })

      player.addListener('playback_error', ({ message }) => {
        console.error('❌ Playback error:', message)
      })

      player.addListener('player_state_changed', state => {
        if (state) {
          console.log('🎵 Playing:', state.track_window.current_track.name)
        }
      })

      player.connect().then(success => {
        if (success) {
          console.log('🎵 Spotify Player connected successfully!')
          window.spotifyPlayerInstance = player
          playerInitialized.current = true
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
      // If SDK already loaded but player not initialized, trigger callback manually
      if (window.Spotify && !window.spotifyPlayerInstance) {
        window.onSpotifyWebPlaybackSDKReady()
      }
    }

    // Cleanup on unmount
    return () => {
      if (window.spotifyPlayerInstance && playerInitialized.current) {
        console.log('🔌 Disconnecting Spotify Player')
        window.spotifyPlayerInstance.disconnect()
        window.spotifyPlayerInstance = undefined
        playerInitialized.current = false
      }
    }
  }, [isLoggedIn])

  return null
}
