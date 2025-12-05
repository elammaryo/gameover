'use client'

import { useRouter } from 'next/navigation'
import logo from '../public/gameover-logo.png'
import sentinelImage from '../public/sentinel.png'
import BlurText from './components/BlurText'
import { NavBar } from './components/NavBar'
import { Button } from './components/Button'
import Image from 'next/image'
import Aurora from './components/Aurora'

export default function Home() {
  const router = useRouter()

  const enterStudio = () => {
    const overlay = document.getElementById('transition-overlay')
    const label = document.getElementById('transition-label')

    if (!overlay) return

    overlay.style.opacity = '1'
    if (label) {
      label.classList.add('opacity-100', 'glitch-once')
    }

    setTimeout(() => {
      router.push('/studio')
    }, 2000)
  }

  return (
    <div className='relative min-h-screen w-full bg-[#07050A] font-sans'>
      {/* Aurora Background */}
      <div className='pointer-events-none fixed inset-0 opacity-30'>
        <Aurora
          colorStops={['#00d4ff', '#ec4899', '#a855f7']}
          amplitude={1.0}
          blend={0.6}
          speed={0.3}
        />
      </div>

      <NavBar />

      {/* HERO SECTION */}
      <main className='flex min-h-screen items-center justify-center'>
        <div className='inset-0 flex w-screen max-lg:justify-center'>
          {/* Sentinel Image */}
          <div className='flex w-[50vw] items-center justify-center max-lg:hidden'>
            <Image
              width={8000}
              height={8000}
              src={sentinelImage}
              className='h-screen object-cover px-12 pt-16'
              alt='Sentinel'
              quality={75}
              decoding='async'
              priority
              placeholder='blur'
            />
          </div>

          {/* Hero Content */}
          <div className='flex w-full flex-col items-start justify-center p-12 lg:w-1/2'>
            <Image
              width={520}
              height={70}
              src={logo.src}
              className='w-130 -translate-x-1'
              alt='GameOver Logo'
              priority
            />
            <BlurText
              text='Next Level Beats.'
              delay={750}
              animateBy='words'
              direction='top'
              className='mt-6 text-6xl font-bold text-white sm:text-7xl'
            />
            <span className='mt-12 max-w-md text-2xl text-gray-300'>
              Trap // Drill // Afrobeats // Experimental
            </span>
            <p className='mt-4 max-w-md text-xl text-gray-300'>
              Premium beats and curated Spotify playlists to elevate your
              listening experience.
            </p>

            {/* CTAs */}
            <div className='mt-12 flex w-full flex-wrap gap-4'>
              <Button
                onClick={enterStudio}
                variant='primary'
                shape='pill'
                className='group relative overflow-hidden shadow-blue-500/30'
              >
                <span className='relative z-10 inline-flex items-center gap-2'>
                  ENTER THE STUDIO
                  <span className='transition-transform duration-300 group-hover:translate-x-1'>
                    →
                  </span>
                </span>
                <span className='pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-[120%] group-hover:opacity-100' />
              </Button>

              <Button
                onClick={() => router.push('/spotify')}
                variant='secondary'
                shape='pill'
              >
                Discover My Spotify
              </Button>
            </div>

            {/* Scroll indicator */}
            <div className='absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce'>
              <span className='text-xs text-gray-500'>Scroll to explore</span>
            </div>
          </div>
        </div>
      </main>

      {/* TEASER SECTION */}
      <section className='relative z-10 bg-gradient-to-b from-transparent to-[#07050A] py-24'>
        <div className='container mx-auto px-4'>
          <h2 className='text-center font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
            What's Inside
          </h2>

          <div className='mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3'>
            {/* Card 1 */}
            <div className='group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-cyan-400/60 hover:bg-white/10'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600'>
                <span className='text-2xl'>🎵</span>
              </div>
              <h3 className='text-xl font-semibold text-white'>
                Premium Beats
              </h3>
              <p className='mt-2 text-gray-400'>
                Trap, Drill, Afrobeats, and Experimental sounds ready to elevate
                your project.
              </p>
            </div>

            {/* Card 2 */}
            <div className='group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-fuchsia-400/60 hover:bg-white/10'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600'>
                <span className='text-2xl'>🎧</span>
              </div>
              <h3 className='text-xl font-semibold text-white'>
                Spotify Playlists
              </h3>
              <p className='mt-2 text-gray-400'>
                Curated vibes from my personal collection. Stream directly in
                the studio.
              </p>
            </div>

            {/* Card 3 */}
            <div className='group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-green-400/60 hover:bg-white/10'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600'>
                <span className='text-2xl'>💻</span>
              </div>
              <h3 className='text-xl font-semibold text-white'>
                Built with Tech
              </h3>
              <p className='mt-2 text-gray-400'>
                Explore the tech stack powering this site. From Next.js to AWS
                S3 streaming.
              </p>
            </div>
          </div>

          {/* Final CTA */}
          <div className='mt-16 text-center'>
            <Button
              onClick={enterStudio}
              variant='outline'
              shape='pill'
              className='mx-auto cursor-pointer'
            >
              Enter The Studio →
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='relative z-10 border-t border-white/10 bg-[#07050A] py-12'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col items-center gap-6'>
            {/* Logo */}
            <Image
              width={260}
              height={35}
              src={logo.src}
              className='w-64 opacity-70'
              alt='GameOver Logo'
              loading='lazy'
            />

            {/* Social Links */}
            <div className='flex items-center gap-6'>
              <a
                href='https://soundcloud.com/goproductions'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-400 transition-colors hover:text-orange-500'
                aria-label='SoundCloud'
              >
                <svg
                  className='h-6 w-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M7 17.939h-1v-8.068c.308-.231.639-.429 1-.566v8.634zm3 0h1v-9.224c-.229.265-.443.548-.621.857l-.379-.184v8.551zm-2 0h1v-8.848c-.508-.079-.623-.05-1-.01v8.858zm-4 0h1v-7.02c-.312.458-.555.971-.692 1.535l-.308-.182v5.667zm-3-5.25c-.606.547-1 1.354-1 2.268 0 .914.394 1.721 1 2.268v-4.536zm18.879-.671c-.204-2.837-2.404-5.079-5.117-5.079-1.022 0-1.964.328-2.762.877v10.123h9.089c1.607 0 2.911-1.393 2.911-3.106 0-2.233-2.168-3.772-4.121-2.815zm-16.879-.027c-.302-.024-.526-.03-1 .122v5.689c.446.143.636.138 1 .138v-5.949z' />
                </svg>
              </a>

              <a
                href='https://open.spotify.com/user/groudono'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-400 transition-colors hover:text-green-500'
                aria-label='Spotify'
              >
                <svg
                  className='h-6 w-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' />
                </svg>
              </a>

              <a
                href='https://instagram.com/omer.el__'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-400 transition-colors hover:text-pink-500'
                aria-label='Instagram'
              >
                <svg
                  className='h-6 w-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                </svg>
              </a>
            </div>

            {/* Copyright */}
            <p className='text-sm text-gray-500'>
              © {new Date().getFullYear()} GameOver. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
