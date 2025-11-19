import { Playlist } from './models/Playlist'

export async function getPlaylists(): Promise<Playlist[]> {
  const res = await fetch('/api/spotify/playlists')
  const data = await res.json()
  console.log('Fetched playlists:', data)
  return data.playlists.map((item: any) => new Playlist(item))
}
