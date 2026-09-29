import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tech stack',
  description:
    'How the GameOver studio is built: Next.js, signed S3 audio, Spotify OAuth and the Web Playback SDK, and WebGL shaders.'
}

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return children
}
