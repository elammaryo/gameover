import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spotify playlists',
  description:
    'Curated playlists from GameOver’s own library: hip-hop, trap, drill, afrobeats and more. Connect Spotify to play them in the browser.'
}

export default function SpotifyLayout({ children }: { children: React.ReactNode }) {
  return children
}
