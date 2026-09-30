'use client'

import { useEffect, useRef } from 'react'
import { getSpotifyAccessToken } from '../api'

/* eslint-disable @typescript-eslint/no-explicit-any -- the Web Playback SDK ships untyped */
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

export interface SpotifyPlayer {
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
  /** lets mobile browsers play; call inside a tap */
  activateElement?(): Promise<void>
  deviceId: string
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** What the SDK reports on every change (the fields we use). */
export type SpotifyState = {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      id: string
      name: string
      uri: string
      duration_ms: number
      artists: { name: string; uri: string }[]
      album: { name: string; images: { url: string; height: number; width: number }[] }
      /** set when Spotify swapped in a regional copy of the track */
      linked_from?: { id: string | null; uri: string | null }
    }
  }
}

// one player per page, however often React re-renders or remounts
let started = false

/**
 * Connects the Spotify Web Playback SDK once the visitor has connected
 * Spotify, and reports every state change to `onState`. The listener reads
 * the latest callback through a ref, so it never acts on stale state.
 */
export function useSpotifyPlayer({
  isLoggedIn,
  onState
}: {
  isLoggedIn: boolean
  onState: (state: SpotifyState | null) => void
}) {
  const onStateRef = useRef(onState)
  useEffect(() => {
    onStateRef.current = onState
  })

  useEffect(() => {
    if (!isLoggedIn || started || window.spotifyPlayerInstance) return
    started = true

    const init = () => {
      if (window.spotifyPlayerInstance || !window.Spotify) return
      const player = new window.Spotify.Player({
        name: 'GameOver Studio',
        getOAuthToken: async cb => {
          const token = await getSpotifyAccessToken().catch(() => null)
          if (token) cb(token)
          else console.error('Spotify: no access token')
        },
        volume: 0.8
      })

      player.addListener('ready', ({ device_id }) => {
        player.deviceId = device_id
      })
      player.addListener('not_ready', ({ device_id }) => {
        console.warn('Spotify device went offline:', device_id)
      })
      player.addListener('initialization_error', ({ message }) =>
        console.error('Spotify initialization error:', message)
      )
      player.addListener('authentication_error', ({ message }) => {
        console.error('Spotify authentication error:', message)
        window.spotifyPlayerInstance = undefined
        started = false
      })
      player.addListener('account_error', ({ message }) =>
        console.error('Spotify account error:', message)
      )
      player.addListener('playback_error', ({ message }) =>
        console.error('Spotify playback error:', message)
      )
      player.addListener('player_state_changed', state =>
        onStateRef.current(state as SpotifyState | null)
      )

      player.connect().then(ok => {
        if (ok) window.spotifyPlayerInstance = player
        else {
          console.error('Failed to connect Spotify Player')
          started = false
        }
      })
    }

    window.onSpotifyWebPlaybackSDKReady = init
    if (!document.getElementById('spotify-player-sdk')) {
      const script = document.createElement('script')
      script.id = 'spotify-player-sdk'
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      script.onerror = () => {
        console.error('Failed to load the Spotify SDK')
        started = false
      }
      document.body.appendChild(script)
    } else if (window.Spotify) {
      init()
    }
  }, [isLoggedIn])
}
