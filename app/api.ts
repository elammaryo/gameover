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

export async function spotifyLoginUrl() {
  const res = await fetch('/api/spotify/login')
  const data = await res.json()
  return data.url
}
