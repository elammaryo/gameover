import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import PlayBarProvider from './providers/PlayBarProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'GameOver - Music Producer',
  description: 'Next Level Beats for Next Level Creators.'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div
          id='transition-overlay'
          className='pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-black opacity-0 transition-opacity duration-500'
        >
          <div
            id='transition-label'
            className='font-mono text-xs tracking-[0.35em] text-gray-300 uppercase opacity-0 transition-opacity duration-200 sm:text-sm'
          >
            ENTERING STUDIO...
          </div>
        </div>
        <PlayBarProvider>{children}</PlayBarProvider>
      </body>
    </html>
  )
}
