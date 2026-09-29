import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Omer Elammary is the Toronto producer and developer behind GameOver: trap, drill and afrobeats with heavy 808s.'
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
