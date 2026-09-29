'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, ShieldAlert, X } from 'lucide-react'
import { navigateWithTransition } from '@/lib/transition'
import { NAV_LINKS, SOCIAL_LINKS } from '@/lib/site'
import { cn } from '@/lib/utils'
import { Mark } from './brand/Mark'
import { useFocusTrap } from './useFocusTrap'
import { Wordmark } from './brand/Wordmark'

const TRANSITION_LABELS: Record<string, string> = {
  '/studio': 'Loading studio',
  '/spotify': 'Loading playlists'
}

/**
 * Global navigation, mounted once in the root layout so the playback-blocker
 * check runs once per visit instead of on every page.
 * `selectedTab` is still accepted for compatibility; the active item is
 * derived from the URL.
 */
export function NavBar({ selectedTab }: { selectedTab?: string } = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const active =
    selectedTab ?? NAV_LINKS.find(l => pathname.startsWith(l.href))?.id
  // Open state remembers the path it was opened on, so any navigation
  // closes the menu / dialog without an effect.
  const [alertOpenOn, setAlertOpenOn] = useState<string | null>(null)
  const showAlert = alertOpenOn === pathname
  const setShowAlert = (open: boolean) => setAlertOpenOn(open ? pathname : null)
  const [hasBlocker, setHasBlocker] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null)
  const isMobileMenuOpen = menuOpenOn === pathname
  const setIsMobileMenuOpen = (open: boolean) =>
    setMenuOpenOn(open ? pathname : null)
  const [scrolled, setScrolled] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const menuPanel = useRef<HTMLDivElement>(null)
  const alertTrigger = useRef<HTMLButtonElement>(null)
  const alertClose = useRef<HTMLButtonElement>(null)
  const alertPanel = useRef<HTMLDivElement>(null)
  useFocusTrap(menuPanel, isMobileMenuOpen)
  useFocusTrap(alertPanel, showAlert)

  useEffect(() => {
    const detectBlocker = async () => {
      // Method 1: Test if we can reach Spotify's API
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        await fetch('https://api.spotify.com/v1/browse/categories?limit=1', {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors'
        })

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

  // solid bar once the page scrolls under it
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // mobile menu: lock scroll, move focus in, Escape to close, restore focus
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpenOn(null)
    }
    window.addEventListener('keydown', onKey)
    const trigger = menuButton.current
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
      trigger?.focus()
    }
  }, [isMobileMenuOpen])

  // blocker dialog: move focus in, Escape to close, restore focus
  useEffect(() => {
    if (!showAlert) return
    const trigger = alertTrigger.current
    alertClose.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAlertOpenOn(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      trigger?.focus()
    }
  }, [showAlert])

  const handleNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
      return
    setIsMobileMenuOpen(false)
    if (pathname === '/' && TRANSITION_LABELS[href]) {
      e.preventDefault()
      navigateWithTransition(router, href, TRANSITION_LABELS[href])
    }
  }

  const blocked = hasBlocker && !isChecking

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300',
          scrolled
            ? 'border-line bg-ink-950/80 backdrop-blur-xl backdrop-saturate-150'
            : 'border-transparent bg-gradient-to-b from-ink-950/85 via-ink-950/45 to-transparent'
        )}
      >
        <nav
          aria-label='Primary'
          className='mx-auto grid h-(--nav-h) max-w-[1440px] grid-cols-[1fr_auto] items-center gap-6 px-5 sm:px-8 md:grid-cols-[1fr_auto_1fr]'
        >
          <Link
            href='/'
            aria-label='GameOver home'
            className='group/mark flex w-fit items-center gap-3 rounded-md'
          >
            <Mark motion='hover' className='size-5 sm:size-[22px]' />
            <Wordmark className='h-[12px] sm:h-[14px]' />
          </Link>

          <ul className='hidden items-center gap-9 md:flex'>
            {NAV_LINKS.map(link => {
              const isActive = active === link.id
              return (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    onClick={e => handleNavigation(e, link.href)}
                    aria-current={isActive ? 'page' : undefined}
                    className='group/nav relative flex items-center gap-2.5 rounded-md py-2 font-mono text-[12px] tracking-[0.22em] uppercase'
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'size-[7px] rounded-[2px] transition-all duration-200',
                        isActive
                          ? 'bg-signal shadow-[0_0_10px_var(--color-signal)]'
                          : 'scale-50 bg-white/0 group-hover/nav:scale-100 group-hover/nav:bg-white/30'
                      )}
                    />
                    <span
                      className={cn(
                        'transition-colors duration-200',
                        isActive
                          ? 'text-bone'
                          : 'text-bone-muted group-hover/nav:text-bone'
                      )}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className='flex items-center justify-end gap-1.5'>
            {blocked && (
              <button
                type='button'
                ref={alertTrigger}
                onClick={() => setShowAlert(true)}
                className='relative flex h-9 items-center gap-2 rounded-lg border border-warn/40 bg-warn/10 px-2.5 text-xs font-medium text-warn transition-colors hover:border-warn/60 hover:bg-warn/15 sm:px-3'
                aria-label='Spotify playback is blocked. Show how to fix it.'
              >
                <span className='absolute -top-1 -right-1 flex size-2.5'>
                  <span className='absolute inline-flex size-full animate-ping rounded-full bg-warn opacity-70' />
                  <span className='relative inline-flex size-2.5 rounded-full bg-warn' />
                </span>
                <ShieldAlert className='size-4' />
                <span className='hidden lg:inline'>Playback blocked</span>
              </button>
            )}

            <div className='hidden items-center md:flex'>
              {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={`GameOver on ${name}`}
                  className='flex size-9 items-center justify-center rounded-lg text-bone-dim transition-colors hover:bg-white/[0.05] hover:text-bone'
                >
                  <Icon className='size-[15px]' />
                </a>
              ))}
            </div>

            <button
              ref={menuButton}
              type='button'
              onClick={() => setIsMobileMenuOpen(true)}
              className='flex size-10 items-center justify-center rounded-lg text-bone transition-colors hover:bg-white/[0.06] md:hidden'
              aria-label='Open menu'
              aria-expanded={isMobileMenuOpen}
              aria-controls='mobile-menu'
            >
              <Menu className='size-5' />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={menuPanel}
            id='mobile-menu'
            role='dialog'
            aria-modal='true'
            aria-label='Menu'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 z-[70] flex flex-col bg-ink-950/95 backdrop-blur-2xl md:hidden'
          >
            <div className='flex h-(--nav-h) items-center justify-between px-5'>
              <span className='flex items-center gap-3'>
                <Mark className='size-5' />
                <Wordmark className='h-[12px]' />
              </span>
              <button
                ref={closeButton}
                type='button'
                onClick={() => setIsMobileMenuOpen(false)}
                className='flex size-10 items-center justify-center rounded-lg text-bone transition-colors hover:bg-white/[0.06]'
                aria-label='Close menu'
              >
                <X className='size-5' />
              </button>
            </div>

            <ul className='flex flex-1 flex-col justify-center px-5'>
              {NAV_LINKS.map((link, i) => {
                const isActive = active === link.id
                return (
                  <motion.li
                    key={link.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.05 + i * 0.045,
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  >
                    <Link
                      href={link.href}
                      onClick={e => handleNavigation(e, link.href)}
                      aria-current={isActive ? 'page' : undefined}
                      className='flex items-center gap-4 border-b border-line py-5'
                    >
                      <span className='tabular w-6 font-mono text-xs text-bone-dim'>
                        0{i + 1}
                      </span>
                      <span
                        className={cn(
                          'font-display-wide text-[2.1rem] uppercase',
                          isActive ? 'text-bone' : 'text-bone/60'
                        )}
                      >
                        {link.label}
                      </span>
                      {isActive && (
                        <span
                          aria-hidden
                          className='size-2 rounded-[2px] bg-signal shadow-[0_0_10px_var(--color-signal)]'
                        />
                      )}
                      <span className='ml-auto text-right text-xs text-bone-dim'>
                        {link.blurb}
                      </span>
                    </Link>
                  </motion.li>
                )
              })}
            </ul>

            <div className='flex items-center justify-between px-5 pt-6 pb-[calc(2rem+var(--safe-area-inset-bottom))]'>
              <p className='font-mono text-[11px] text-bone-dim'>
                © {new Date().getFullYear()} GameOver
              </p>
              <div className='flex items-center gap-1'>
                {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label={`GameOver on ${name}`}
                    className='flex size-10 items-center justify-center rounded-lg text-bone-muted transition-colors hover:text-bone'
                  >
                    <Icon className='size-4' />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playback-blocked help */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[80] flex items-start justify-center bg-black/60 px-4 pt-24 backdrop-blur-sm'
            onClick={() => setShowAlert(false)}
          >
            <motion.div
              ref={alertPanel}
              role='dialog'
              aria-modal='true'
              aria-labelledby='blocker-title'
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className='surface-raised relative w-full max-w-md rounded-2xl p-6'
              onClick={e => e.stopPropagation()}
            >
              <button
                ref={alertClose}
                type='button'
                onClick={() => setShowAlert(false)}
                className='absolute top-4 right-4 flex size-8 items-center justify-center rounded-lg text-bone-dim transition-colors hover:bg-white/[0.06] hover:text-bone'
                aria-label='Close'
              >
                <X className='size-4' />
              </button>

              <div className='mb-5 flex size-11 items-center justify-center rounded-xl bg-warn/15 text-warn ring-1 ring-warn/30 ring-inset'>
                <ShieldAlert className='size-5' />
              </div>

              <h3
                id='blocker-title'
                className='font-display-tight mb-2 text-xl text-bone'
              >
                Something is blocking Spotify
              </h3>
              <p className='mb-5 text-sm leading-relaxed text-bone-muted'>
                A browser extension or privacy setting is stopping the
                Spotify player from connecting. Beats still play; Spotify
                tracks need these allowed:
              </p>

              <ol className='mb-5 space-y-2.5 rounded-xl border border-line bg-white/[0.02] p-4 text-sm text-bone-muted'>
                <li className='flex gap-3'>
                  <span className='tabular font-mono text-warn'>01</span>
                  <span>
                    Allow <strong className='text-bone'>gameover.studio</strong>{' '}
                    in your blocker
                  </span>
                </li>
                <li className='flex gap-3'>
                  <span className='tabular font-mono text-warn'>02</span>
                  <span>
                    Allow <strong className='text-bone'>*.spotify.com</strong>{' '}
                    and <strong className='text-bone'>*.scdn.co</strong>
                  </span>
                </li>
                <li className='flex gap-3'>
                  <span className='tabular font-mono text-warn'>03</span>
                  <span>Refresh the page</span>
                </li>
              </ol>

              <p className='hud-label mb-2.5'>Common culprits</p>
              <div className='mb-6 flex flex-wrap gap-2'>
                {[
                  'uBlock Origin',
                  'Privacy Badger',
                  'Firefox ETP',
                  'Brave Shields'
                ].map(name => (
                  <span
                    key={name}
                    className='rounded-md border border-line px-2 py-1 font-mono text-[11px] text-bone-muted'
                  >
                    {name}
                  </span>
                ))}
              </div>

              <button
                type='button'
                onClick={() => setShowAlert(false)}
                className='h-11 w-full rounded-xl bg-bone text-sm font-semibold text-ink-950 transition-colors hover:bg-white'
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
