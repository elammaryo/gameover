'use client'

import { useRouter } from 'next/navigation'
import logo from '../public/gameover-logo.png'
import backgroundImage from '../public/background.png'
import sentinelImage from '../public/sentinel.png'
import headphonesImage from '../public/headphones.png'
import BlurText from './components/BlurText'
import { NavBar } from './components/NavBar'
import { Button } from './components/Button'

export default function Home() {
  const router = useRouter()

  const enterStudio = () => {
    const overlay = document.getElementById('transition-overlay')
    const label = document.getElementById('transition-label')

    if (!overlay) return

    const sfx = new Audio('/sfx/whoosh.mp3')
    sfx.volume = 0.4
    sfx.play().catch(() => {})

    overlay.style.opacity = '1'
    if (label) {
      label.classList.add('opacity-100', 'glitch-once')
    }

    setTimeout(() => {
      router.push('/studio')
    }, 2000)
  }

  return (
    <div className='flex min-h-screen w-full items-center bg-[#07050A] font-sans'>
      <NavBar />
      <main className='flex min-h-screen max-w-3xl flex-col items-center justify-center sm:items-start'>
        <div className='inset-0 flex w-screen max-lg:justify-center'>
          <div className='flex w-[50vw] items-center justify-center max-lg:hidden'>
            <img
              src={sentinelImage.src}
              className='h-[calc(100vh-50px)] translate-y-[30px] object-cover'
              alt='Logo'
            />
          </div>

          <div className='w-screen-1/2 flex min-h-screen flex-col items-start justify-center p-12 pt-30 sm:p-32'>
            <img src={logo.src} className='w-130 -translate-x-1' alt='Logo' />
            <BlurText
              text='Next Level Beats.'
              delay={750}
              animateBy='words'
              direction='top'
              className='mt-6 text-5xl font-bold text-white sm:text-7xl'
            />
            <span className='mt-12 max-w-md text-2xl text-gray-300'>
              Trap // Drill // Afrobeats // Experimental
            </span>
            <p className='mt-4 max-w-md text-2xl text-gray-300'>
              Your headphones are about to get a promotion.
            </p>
            <div className='mt-8 flex w-full flex-wrap gap-4'>
              <Button
                onClick={enterStudio}
                variant='primary'
                shape='pill' // change to "rounded" if you want rectangular
                className='group animate-buttonMount relative overflow-hidden shadow-blue-500/30'
              >
                <span className='relative z-10 inline-flex items-center gap-2'>
                  ENTER THE STUDIO
                  <span className='transition-transform duration-300 group-hover:translate-x-1'>
                    →
                  </span>
                </span>

                {/* shine sweep */}
                <span className='pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-[120%] group-hover:opacity-100' />
              </Button>

              {/* SECONDARY CTA */}
              <Button
                onClick={() => router.push('/studio')}
                variant='secondary'
                shape='pill'
              >
                EXPLORE BEATS
              </Button>
              {/* <button
                onClick={enterStudio}
                className='group relative overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 px-8 py-3 text-xl font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-fuchsia-500/40 focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:outline-none active:translate-y-0 active:scale-[0.98]'
              >
                <span className='relative z-10 inline-flex items-center gap-2'>
                  ENTER THE STUDIO
                  <span className='transition-transform duration-300 group-hover:translate-x-1'>
                    →
                  </span>
                </span>

                <span className='pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-[120%] group-hover:opacity-100' />
              </button>

              <button
                onClick={() => router.push('/studio')}
                className='rounded-full border border-gray-600/70 bg-white/0 px-8 py-3 text-xl font-semibold text-gray-100 transition-all duration-300 hover:translate-y-[-2px] hover:border-gray-300 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-gray-400/60 focus-visible:outline-none active:translate-y-0 active:scale-[0.98]'
              >
                EXPLORE BEATS
              </button> */}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
