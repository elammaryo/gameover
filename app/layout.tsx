import type { Metadata, Viewport } from 'next'
import { Archivo, Geist, Geist_Mono, Silkscreen } from 'next/font/google'
import './globals.css'
import PlayBarProvider from './providers/PlayBarProvider'
import MotionProvider from './providers/MotionProvider'
import { Analytics } from '@vercel/analytics/next'
import { PlayerBar, PlayerSpacer } from './components/PlayerBar'
import { Backdrop } from './components/Backdrop'
import { StageTransition } from './components/StageTransition'
import { NavBar } from './components/NavBar'
import { SiteFooter } from './components/SiteFooter'
import { HiddenOnHome } from './components/HiddenOnHome'
import { CheatCodes } from './components/CheatCodes'
import { RouteTheme } from './components/RouteTheme'
import { THEME_SCRIPT } from '@/lib/theme'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

// Display face: Archivo's width axis gives the expanded, heavy headlines
const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  axes: ['wdth']
})

// Pixel face, used sparingly for arcade moments (loading, 404, hi-scores)
const silkscreen = Silkscreen({
  variable: '--font-silkscreen',
  subsets: ['latin'],
  weight: ['400', '700']
})

export const metadata: Metadata = {
  metadataBase: new URL('https://gameover.studio'),
  title: {
    default: 'GameOver — Next Level Beats',
    template: '%s · GameOver'
  },
  description:
    'Trap, drill and hip-hop beats by GameOver. Stream original beats and curated Spotify playlists, right in the browser.',
  applicationName: 'GameOver',
  openGraph: {
    type: 'website',
    siteName: 'GameOver',
    title: 'GameOver — Next Level Beats',
    description:
      'Trap, drill and hip-hop beats by GameOver. Stream original beats and curated playlists in the studio.',
    url: '/'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GameOver — Next Level Beats',
    description:
      'Trap, drill and hip-hop beats by GameOver. Stream original beats and curated playlists in the studio.'
  }
}

export const viewport: Viewport = {
  themeColor: '#07060a',
  colorScheme: 'dark'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${silkscreen.variable}`}
      // data-theme is set by THEME_SCRIPT before React hydrates
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className='antialiased'>
        <RouteTheme />
        <a
          href='#content'
          className='sr-only z-[100] rounded-lg bg-bone px-4 py-2 font-medium text-ink-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3'
        >
          Skip to content
        </a>
        <MotionProvider>
          <PlayBarProvider>
            <StageTransition />
            <Backdrop />
            <NavBar />
            <PlayerBar />
            {/* positioned (no z-index) so it paints above the backdrop without
                trapping the nav / modals in a lower stacking context */}
            <div id='content' className='relative overflow-x-clip'>
              {children}
            </div>
            <HiddenOnHome>
              <SiteFooter />
            </HiddenOnHome>
            <CheatCodes />
            <PlayerSpacer />
            <Analytics />
          </PlayBarProvider>
        </MotionProvider>
      </body>
    </html>
  )
}
