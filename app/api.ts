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

export async function getBeatSignedUrl(trackId: string): Promise<string> {
  const res = await fetch(`/api/beats/signedUrl`, {
    method: 'POST',
    body: JSON.stringify({ trackId }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const data = await res.json()
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

export async function getSpotifyAccessToken(): Promise<string | null> {
  const res = await fetch('/api/spotify/token')
  const data = await res.json()
  return data.accessToken
}

export async function playSpotifyTrack({
  uris,
  contextUri,
  offset
}: {
  uris?: string[]
  contextUri?: string
  offset?: number
}) {
  const deviceId = window.spotifyPlayerInstance?.deviceId
  const accessToken = await getSpotifyAccessToken()

  if (!deviceId || !accessToken) {
    console.error('Cannot play track: Missing device ID or access token')
    return
  }

  fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      uris: uris,
      context_uri: contextUri,
      offset: { position: offset }
    })
  })
    .then(async response => {
      if (!response.ok) {
        throw new Error('Failed to play track')
      }
      window.spotifyPlayerInstance?.resume()
    })
    .catch(error => console.error('Error starting playback:', error))
}
