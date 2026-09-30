import type { Metadata } from 'next'

export const metadata: Metadata = {
  // re-declare the template so nested pack pages keep the suffix
  title: { default: 'Studio', template: '%s · GameOver' },
  description:
    'Stream original trap, drill and hip-hop beats by GameOver. Filter by genre, tempo and mood, or play a whole pack.'
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children
}
