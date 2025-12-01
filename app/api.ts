import { Playlist } from './models/Playlist'
import { Track, BeatTrack, SpotifyTrack } from './models/Track'

export async function getPlaylists(): Promise<Playlist[]> {
  const res = await fetch('/api/spotify/playlists')
  const data = await res.json()
  return data.playlists.map((item: any) => new Playlist(item))
}

export async function getBeats(): Promise<BeatTrack[]> {
  const res = await fetch('/api/beats')
  const data = await res.json()
  return data.map((item: any) => new BeatTrack(item))
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
    (item: any) =>
      new SpotifyTrack({
        ...item,
        images: item.album.images,
        artists: [item.artists.map((a: any) => a.name)]
      })
  )
}

export async function getSpotifyTopArtists(): Promise<[]> {
  const res = await fetch('/api/spotify/stats/topArtists')
  const data = await res.json()
  return data.topArtists.map((item: any) => ({
    name: item.name,
    images: item.images
  }))
}

export async function spotifyLoginUrl() {
  const res = await fetch('/api/spotify/login')
  const data = await res.json()
  return data.url
}

export async function spotifyLogout() {
  try {
    await fetch('/api/spotify/logout', { method: 'POST' })
    // Reload to clear player state
    window.location.reload()
  } catch (error) {
    console.error('Error logging out:', error)
  }
}
