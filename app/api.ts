import { Playlist } from './models/Playlist'
import { Track, BeatTrack } from './models/Track'

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
