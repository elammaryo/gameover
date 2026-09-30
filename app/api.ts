import { Playlist } from './models/Playlist'
import { BeatTrack, SpotifyTrack } from './models/Track'

export async function getSpotifyPlaylists(): Promise<Playlist[]> {
  const res = await fetch('/api/spotify/playlists')
  const data = await res.json()
  return data.playlists.map(
    (item: Playlist) => new Playlist({ ...item, type: 'spotify' })
  )
}

export async function getBeatsPlaylists(): Promise<Playlist[]> {
  const res = await fetch('/api/beats/playlists')
  const data = await res.json()
  return data.map((item: Playlist) => new Playlist({ ...item, type: 'beat' }))
}

export async function getPlaylistTracks(playlistId: string) {
  const res = await fetch(`/api/spotify/playlist/${playlistId}`)
  const data = await res.json()
  return data.playlist
}

export async function getBeats(): Promise<BeatTrack[]> {
  const res = await fetch('/api/beats')
  const data = await res.json()
  return data.map((item: BeatTrack) => new BeatTrack(item))
}

export async function getBeatSignedUrl(
  trackId: string,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(`/api/beats/signedUrl`, {
    method: 'POST',
    body: JSON.stringify({ trackId }),
    headers: {
      'Content-Type': 'application/json'
    },
    signal
  })
  if (!res.ok) throw new Error(`Couldn't get an audio link (${res.status})`)
  const data = await res.json()
  if (!data.audioUrl) throw new Error('No audio link in the response')
  return data.audioUrl
}

export async function getSpotifyTopTracks(): Promise<SpotifyTrack[]> {
  const res = await fetch('/api/spotify/stats/topTracks')
  const data = await res.json()
  return data.topTracks.map(
    (item: SpotifyTrack) =>
      new SpotifyTrack({
        ...item,
        images: item.album.images,
        artists: item.artists
      })
  )
}

export async function getSpotifyTopArtists(): Promise<[]> {
  const res = await fetch('/api/spotify/stats/topArtists')
  const data = await res.json()
  return data.topArtists.map(
    (item: { name: string; images: { url: string }[] }) => ({
      name: item.name,
      images: item.images
    })
  )
}

export async function spotifyLoginUrl() {
  const res = await fetch('/api/spotify/login')
  const data = await res.json()
  return data.url
}

export async function getSpotifyAccessToken(signal?: AbortSignal): Promise<string | null> {
  const res = await fetch('/api/spotify/token', { signal })
  const data = await res.json()
  return data.accessToken
}

/**
 * Starts Spotify playback on this browser's Web Playback SDK device.
 * Resolves true once Spotify accepted the request.
 */
export async function playSpotifyTrack({
  uris,
  contextUri,
  offset,
  positionMs,
  signal
}: {
  uris?: string[]
  contextUri?: string
  offset?: number
  positionMs?: number
  /** abort it (a newer start is going out) */
  signal?: AbortSignal
}): Promise<boolean> {
  const deviceId = window.spotifyPlayerInstance?.deviceId
  // a request that never answers mustn't hold up the next one
  const abort = new AbortController()
  const timer = window.setTimeout(() => abort.abort(), 8000)
  signal?.addEventListener('abort', () => abort.abort(), { once: true })
  if (signal?.aborted) abort.abort()
  try {
    const accessToken = await getSpotifyAccessToken(abort.signal).catch(() => null)
    if (!deviceId || !accessToken) {
      console.error('Cannot play track: Missing device ID or access token')
      return false
    }
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: 'PUT',
        signal: abort.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          uris,
          context_uri: contextUri,
          offset: offset === undefined ? undefined : { position: offset },
          position_ms: positionMs ? Math.round(positionMs) : undefined
        })
      }
    )
    if (!response.ok) throw new Error(`Spotify said ${response.status}`)
    return true
  } catch (error) {
    console.error('Error starting playback:', error)
    return false
  } finally {
    window.clearTimeout(timer)
  }
}
