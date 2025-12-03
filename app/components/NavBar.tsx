'use client'
import NextImage from 'next/image'
import { useState, useEffect } from 'react'
import { HiShieldExclamation, HiXMark } from 'react-icons/hi2'
import logo from '../../public/gameover-logo.png'

export function NavBar({ selectedTab }: { selectedTab?: string }) {
  const tabs = ['studio', 'spotify', 'tech', 'about']
  const [showAlert, setShowAlert] = useState(false)
  const [hasBlocker, setHasBlocker] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const detectBlocker = async () => {
      // Method 1: Test if we can reach Spotify's API
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        const response = await fetch(
          'https://api.spotify.com/v1/browse/categories?limit=1',
          {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'no-cors' // Just check if request goes through
          }
        )

        clearTimeout(timeoutId)
      } catch (error) {
        console.warn('🛡️ Spotify API blocked:', error)
        setHasBlocker(true)
        setIsChecking(false)
        return
      }

      // Method 2: Monitor console errors for CORS failures
      const originalError = console.error
      let errorDetected = false

      console.error = (...args) => {
        const message = args.join(' ')

        if (
          message.includes('apresolve.spotify.com') ||
          message.includes('spclient.wg.spotify.com') ||
          message.includes('dealer.g2.spotify.com') ||
          message.includes('Failed to connect Spotify Player') ||
          message.includes('Cross-Origin Request Blocked')
        ) {
          if (!errorDetected) {
            console.warn('🛡️ Blocker detected via CORS error')
            setHasBlocker(true)
            errorDetected = true
          }
        }

        originalError.apply(console, args)
      }

      // Method 3: Check if SDK loads but player fails to initialize
      const checkInterval = setInterval(() => {
        const sdkScript = document.getElementById('spotify-player-sdk')

        if (sdkScript && window.Spotify) {
          // SDK loaded, check if player can initialize
          setTimeout(() => {
            if (!window.spotifyPlayerInstance) {
              console.warn('🛡️ Spotify player failed to initialize')
              setHasBlocker(true)
              clearInterval(checkInterval)
            }
            setIsChecking(false)
          }, 5000)
        }
      }, 1000)

      // Method 4: Try loading a small Spotify resource
      const testImage = new Image()
      testImage.onerror = () => {
        console.warn('🛡️ Spotify CDN blocked')
        setHasBlocker(true)
      }
      testImage.src =
        'https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228' // Small Spotify image

      // Cleanup after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        console.error = originalError
        setIsChecking(false)
      }, 10000)
    }

    detectBlocker()
  }, [])

  return (
    <>
      <nav className='fixed top-0 z-50 flex w-full items-center justify-between gap-6 bg-black/50 px-8 py-6 backdrop-blur-sm sm:pr-18 sm:pl-10'>
        <a href='/'>
          <NextImage
            width={100}
            height={35}
            src={logo.src}
            className='h-3.5 w-auto object-contain'
            alt='Logo'
          />
        </a>

        <div className='flex items-center gap-6'>
          <div className='flex space-x-5 sm:space-x-12'>
            {tabs.map(tab => (
              <div className='flex flex-col' key={tab}>
                <a
                  href={`/${tab}`}
                  className={
                    'text-white' + (selectedTab === tab ? ' font-bold' : '')
                  }
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </a>
                {selectedTab === tab && (
                  <div className='mt-1 h-0.5 w-full bg-white'></div>
                )}
              </div>
            ))}
          </div>

          {/* Status Warning Button */}
          {hasBlocker && (
            <button
              onClick={() => setShowAlert(!showAlert)}
              className='group relative flex items-center gap-2 rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-orange-500/10 px-3 py-2 transition-all hover:border-amber-500/60 hover:from-amber-500/30 hover:to-orange-500/20'
              aria-label='Content blocker detected'
            >
              {/* Pulsing dot indicator */}
              <span className='absolute -top-1 -right-1 flex h-3 w-3'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75'></span>
                <span className='relative inline-flex h-3 w-3 rounded-full bg-amber-500'></span>
              </span>

              {/* Shield warning icon */}
              <HiShieldExclamation size={20} className='text-amber-400' />

              {/* Status text (hidden on mobile) */}
              <span className='hidden text-xs font-medium text-amber-400 sm:inline'>
                Status
              </span>
            </button>
          )}

          {/* Checking indicator (optional) */}
          {isChecking && !hasBlocker && (
            <div className='flex items-center gap-2 text-xs text-gray-500'>
              <div className='h-2 w-2 animate-pulse rounded-full bg-gray-500'></div>
              <span className='hidden sm:inline'>Checking...</span>
            </div>
          )}
        </div>
      </nav>

      {/* Alert Modal */}
      {showAlert && hasBlocker && (
        <div
          className='fixed inset-0 z-[60] flex items-start justify-center bg-black/50 pt-24 backdrop-blur-sm'
          onClick={() => setShowAlert(false)}
        >
          <div
            className='animate-in fade-in slide-in-from-top-4 relative mx-4 w-full max-w-md duration-300'
            onClick={e => e.stopPropagation()}
          >
            <div className='rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-6 shadow-2xl backdrop-blur-xl'>
              {/* Close button */}
              <button
                onClick={() => setShowAlert(false)}
                className='absolute top-4 right-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white'
                aria-label='Close'
              >
                <HiXMark size={20} />
              </button>

              {/* Icon */}
              <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25'>
                <HiShieldExclamation size={28} className='text-white' />
              </div>

              {/* Content */}
              <h3 className='mb-2 text-xl font-bold text-white'>
                Content Blocker Detected
              </h3>
              <p className='mb-4 text-sm text-gray-300'>
                A browser extension or privacy setting is blocking connections
                to Spotify's servers. To enable in-browser playback, you'll need
                to adjust your blocker settings.
              </p>

              {/* How to Fix */}
              <div className='mb-4 rounded-xl border border-white/10 bg-white/5 p-4'>
                <p className='mb-3 text-xs font-semibold tracking-wider text-amber-400 uppercase'>
                  How to Fix
                </p>
                <ul className='space-y-2 text-sm text-gray-300'>
                  <li className='flex items-start gap-2'>
                    <span className='mt-0.5 flex-shrink-0 text-amber-400'>
                      1.
                    </span>
                    <span>
                      Whitelist{' '}
                      <strong className='text-white'>gameover.studio</strong> in
                      your content blocker
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='mt-0.5 flex-shrink-0 text-amber-400'>
                      2.
                    </span>
                    <span>
                      Allow these Spotify domains:{' '}
                      <strong className='text-white'>*.spotify.com</strong>,{' '}
                      <strong className='text-white'>*.scdn.co</strong>
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='mt-0.5 flex-shrink-0 text-amber-400'>
                      3.
                    </span>
                    <span>Refresh the page after updating settings</span>
                  </li>
                </ul>
              </div>

              {/* Common Blockers */}
              <div className='mb-4 rounded-xl border border-white/10 bg-white/5 p-4'>
                <p className='mb-2 text-xs font-semibold tracking-wider text-amber-400 uppercase'>
                  Common Causes
                </p>
                <div className='flex flex-wrap gap-2 text-xs text-gray-400'>
                  <span className='rounded-full border border-white/10 bg-white/5 px-2 py-1'>
                    uBlock Origin
                  </span>
                  <span className='rounded-full border border-white/10 bg-white/5 px-2 py-1'>
                    Privacy Badger
                  </span>
                  <span className='rounded-full border border-white/10 bg-white/5 px-2 py-1'>
                    Firefox ETP
                  </span>
                  <span className='rounded-full border border-white/10 bg-white/5 px-2 py-1'>
                    Brave Shields
                  </span>
                </div>
              </div>

              {/* Alternative */}
              <p className='mb-4 text-xs text-gray-400'>
                <strong className='text-gray-300'>Alternative:</strong> You can
                browse playlists and open tracks directly in the Spotify app.
              </p>

              {/* Action button */}
              <button
                onClick={() => setShowAlert(false)}
                className='w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]'
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
