'use client'
import NextImage from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  HiShieldExclamation,
  HiXMark,
  HiBars3,
  HiCheckCircle
} from 'react-icons/hi2'
import { AnimatePresence, motion } from 'motion/react'
import logo from '../../public/gameover-logo.png'

export function NavBar({ selectedTab }: { selectedTab?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const tabs = ['studio', 'spotify', 'tech', 'about']
  const [showAlert, setShowAlert] = useState(false)
  const [hasBlocker, setHasBlocker] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
            mode: 'no-cors'
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
        'https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228'
      testImage.alt = 'Spotify Test'

      // Cleanup after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        console.error = originalError
        setIsChecking(false)
      }, 10000)
    }

    detectBlocker()
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleNavigation = (tab: string) => {
    const currentIsHome = pathname === '/'
    const nextIsMedia = tab === 'studio' || tab === 'spotify'

    setIsMobileMenuOpen(false)

    if (currentIsHome && nextIsMedia) {
      const overlay = document.getElementById('transition-overlay')
      const label = document.getElementById('transition-label')

      if (overlay) {
        overlay.style.opacity = '1'
      }
      if (label) {
        label.classList.add('opacity-100', 'glitch-once')
      }

      setTimeout(() => {
        router.push(`/${tab}`)
      }, 500)
    } else {
      router.push(`/${tab}`)
    }
  }

  return (
    <>
      <nav className='fixed top-0 z-50 flex w-full items-center justify-between gap-2 bg-black/50 px-4 py-4 backdrop-blur-sm sm:gap-6 sm:px-10 sm:py-7'>
        <a href='/' className='flex-shrink-0'>
          <NextImage
            width={100}
            height={35}
            src={logo.src}
            className='h-3 w-auto object-contain sm:h-3.5'
            alt='Logo'
          />
        </a>

        {/* Desktop Navigation */}
        <div className='hidden flex-1 items-center justify-end gap-3 sm:absolute sm:left-1/2 sm:flex sm:-translate-x-1/2 sm:justify-center sm:gap-4'>
          <div className='flex gap-10 text-base'>
            {tabs.map(tab => {
              const isActive = selectedTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => handleNavigation(tab)}
                  className={`group relative font-mono text-lg tracking-[0.15em] whitespace-nowrap uppercase transition-all duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab}
                  <span
                    className={`absolute -bottom-1 left-0 h-[2px] w-full bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 transition-all duration-300 ${
                      isActive
                        ? 'scale-x-100 opacity-100'
                        : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-50'
                    }`}
                  />
                </button>
              )
            })}
          </div>

          {/* Status Warning - Desktop */}
          {hasBlocker && !isChecking && (
            <button
              onClick={() => setShowAlert(!showAlert)}
              className='group relative ml-4 flex flex-shrink-0 items-center gap-2 rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-orange-500/10 px-3 py-2 transition-all hover:border-amber-500/60 hover:from-amber-500/30 hover:to-orange-500/20'
              aria-label='Content blocker detected'
            >
              <span className='absolute -top-1 -right-1 flex h-3 w-3'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75'></span>
                <span className='relative inline-flex h-3 w-3 rounded-full bg-amber-500'></span>
              </span>

              <HiShieldExclamation size={18} className='text-amber-400' />
              <span className='text-xs font-medium text-amber-400'>Status</span>
            </button>
          )}

          {/* Status Success - Desktop */}
          {!hasBlocker && !isChecking && (
            <button
              onClick={() => setShowAlert(!showAlert)}
              className='group relative ml-4 flex flex-shrink-0 items-center gap-2 rounded-lg border border-green-500/40 bg-gradient-to-br from-green-500/20 to-emerald-500/10 px-3 py-2 transition-all hover:border-green-500/60 hover:from-green-500/30 hover:to-emerald-500/20'
              aria-label='All systems operational'
            >
              <HiCheckCircle size={18} className='text-green-400' />
              <span className='text-xs font-medium text-green-400'>Status</span>
            </button>
          )}

          {/* Checking Indicator - Desktop */}
          {isChecking && (
            <div className='ml-4 flex flex-shrink-0 items-center gap-2 text-xs text-gray-500'>
              <div className='h-2 w-2 animate-pulse rounded-full bg-gray-500'></div>
              <span>Checking...</span>
            </div>
          )}
        </div>

        {/* Mobile Right Section */}
        <div className='flex items-center gap-2 sm:hidden'>
          {/* Status Warning - Mobile */}
          {hasBlocker && !isChecking && (
            <button
              onClick={() => setShowAlert(!showAlert)}
              className='group relative flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-orange-500/10 px-2 py-1.5 transition-all hover:border-amber-500/60'
              aria-label='Content blocker detected'
            >
              <span className='absolute -top-1 -right-1 flex h-2.5 w-2.5'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75'></span>
                <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500'></span>
              </span>

              <HiShieldExclamation size={16} className='text-amber-400' />
            </button>
          )}

          {/* Status Success - Mobile */}
          {!hasBlocker && !isChecking && (
            <button
              onClick={() => setShowAlert(!showAlert)}
              className='group relative flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-green-500/40 bg-gradient-to-br from-green-500/20 to-emerald-500/10 px-2 py-1.5 transition-all hover:border-green-500/60'
              aria-label='All systems operational'
            >
              <HiCheckCircle size={16} className='text-green-400' />
            </button>
          )}

          {/* Checking Indicator - Mobile */}
          {isChecking && (
            <div className='flex flex-shrink-0 items-center'>
              <div className='h-1.5 w-1.5 animate-pulse rounded-full bg-gray-500'></div>
            </div>
          )}

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='rounded-lg p-2 text-white transition-colors hover:bg-white/10'
            aria-label='Open menu'
          >
            <HiBars3 size={24} />
          </button>
        </div>

        <div className='hidden w-[120px] flex-shrink-0 sm:block' />
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='fixed inset-0 z-[55] bg-black/80 backdrop-blur-sm sm:hidden'
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300
              }}
              className='fixed inset-y-0 right-0 z-[56] w-[75vw] max-w-[300px] border-l border-white/10 bg-[#05040A]/98 shadow-2xl sm:hidden'
            >
              <div className='flex items-center justify-between border-b border-white/10 p-4'>
                <span className='font-mono text-xs tracking-[0.2em] text-gray-400 uppercase'>
                  Menu
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className='rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white'
                  aria-label='Close menu'
                >
                  <HiXMark size={20} />
                </button>
              </div>

              <div className='flex flex-col gap-1 p-4'>
                {tabs.map(tab => {
                  const isActive = selectedTab === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => handleNavigation(tab)}
                      className={`group relative rounded-xl px-4 py-4 text-left font-mono text-sm tracking-[0.15em] uppercase transition-all ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {tab}
                      {isActive && (
                        <span className='absolute top-1/2 left-0 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 via-blue-400 to-fuchsia-400' />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className='absolute right-0 bottom-0 left-0 border-t border-white/10 p-4'>
                <div className='flex items-center gap-2'>
                  <NextImage
                    width={80}
                    height={28}
                    src={logo.src}
                    className='h-3 w-auto object-contain opacity-50'
                    alt='Logo'
                  />
                </div>
                <p className='mt-2 text-xs text-gray-500'>
                  © {new Date().getFullYear()} GameOver
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Alert Modal */}
      {showAlert && (
        <div
          className='fixed inset-0 z-[60] flex items-start justify-center bg-black/50 pt-24 backdrop-blur-sm'
          onClick={() => setShowAlert(false)}
        >
          <div
            className='animate-in fade-in slide-in-from-top-4 relative mx-4 w-full max-w-md duration-300'
            onClick={e => e.stopPropagation()}
          >
            {hasBlocker ? (
              // Blocker Detected Modal
              <div className='rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-6 shadow-2xl backdrop-blur-xl'>
                <button
                  onClick={() => setShowAlert(false)}
                  className='absolute top-4 right-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white'
                  aria-label='Close'
                >
                  <HiXMark size={20} />
                </button>

                <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25'>
                  <HiShieldExclamation size={28} className='text-white' />
                </div>

                <h3 className='mb-2 text-xl font-bold text-white'>
                  Content Blocker Detected
                </h3>
                <p className='mb-4 text-sm text-gray-300'>
                  A browser extension or privacy setting is blocking Spotify
                  connections. Adjust your blocker settings to enable in-browser
                  playback.
                </p>

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
                        <strong className='text-white'>gameover.studio</strong>
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <span className='mt-0.5 flex-shrink-0 text-amber-400'>
                        2.
                      </span>
                      <span>
                        Allow{' '}
                        <strong className='text-white'>*.spotify.com</strong>{' '}
                        and <strong className='text-white'>*.scdn.co</strong>
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <span className='mt-0.5 flex-shrink-0 text-amber-400'>
                        3.
                      </span>
                      <span>Refresh the page</span>
                    </li>
                  </ul>
                </div>

                <div className='mb-4 rounded-xl border border-white/10 bg-white/5 p-4'>
                  <p className='mb-2 text-xs font-semibold tracking-wider text-amber-400 uppercase'>
                    Common Blockers
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

                <button
                  onClick={() => setShowAlert(false)}
                  className='w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]'
                >
                  Got it
                </button>
              </div>
            ) : (
              // All Clear Modal
              <div className='rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent p-6 shadow-2xl backdrop-blur-xl'>
                <button
                  onClick={() => setShowAlert(false)}
                  className='absolute top-4 right-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white'
                  aria-label='Close'
                >
                  <HiXMark size={20} />
                </button>

                <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25'>
                  <HiCheckCircle size={28} className='text-white' />
                </div>

                <h3 className='mb-2 text-xl font-bold text-white'>
                  All Systems Operational
                </h3>
                <p className='mb-4 text-sm text-gray-300'>
                  No content blockers detected. Spotify playback is fully
                  functional and ready to use.
                </p>

                <div className='mb-4 rounded-xl border border-white/10 bg-white/5 p-4'>
                  <ul className='space-y-2 text-sm text-gray-300'>
                    <li className='flex items-center gap-2'>
                      <span className='text-green-400'>✓</span>
                      <span>Spotify API accessible</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='text-green-400'>✓</span>
                      <span>Web Playback SDK loaded</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='text-green-400'>✓</span>
                      <span>No blocking detected</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowAlert(false)}
                  className='w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]'
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
