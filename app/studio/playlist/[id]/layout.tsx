import type { Metadata } from 'next'
import packs from '@/app/api/beats/playlists.json'
import { LOCAL_BEATS, packBeats } from '@/lib/beats'

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const slug = decodeURIComponent(id).toLowerCase()
  const pack = packs.find(p => p.name.toLowerCase() === slug)
  if (!pack) return { title: 'Pack not found' }
  return {
    title: `${pack.name} beat pack`,
    description: `The ${pack.name} pack by GameOver: ${packBeats(pack.trackIds, LOCAL_BEATS).length} beats to stream in the studio.`
  }
}

export default function PackLayout({ children }: { children: React.ReactNode }) {
  return children
}
