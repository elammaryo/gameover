'use client'

import { useEffect, useState } from 'react'
import { getSpotifyAccessToken } from '../api'

export type SpotifySession = 'checking' | 'connected' | 'disconnected'

async function readSession(): Promise<Exclude<SpotifySession, 'checking'>> {
  const flag = document.cookie
    .split(';')
    .find(c => c.trim().startsWith('spotify_logged_in='))
    ?.split('=')[1]
  if (flag !== 'true') return 'disconnected'
  const token = await getSpotifyAccessToken().catch(() => null)
  return token ? 'connected' : 'disconnected'
}

/**
 * Whether the visitor has connected Spotify: the session cookie plus a
 * usable access token. Starts as 'checking' so connected visitors never see
 * a flash of the "connect" prompt.
 */
export function useSpotifySession(): SpotifySession {
  const [status, setStatus] = useState<SpotifySession>('checking')

  useEffect(() => {
    let cancelled = false
    readSession().then(next => {
      if (!cancelled) setStatus(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return status
}
