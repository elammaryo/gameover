'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { HiExclamationTriangle, HiXMark } from 'react-icons/hi2'
import logo from '../../public/gameover-logo.png'

export function NavBar({ selectedTab }: { selectedTab?: string }) {
  const tabs = ['studio', 'spotify', 'tech', 'about']
  const [showAlert, setShowAlert] = useState(false)
  const [isFirefox, setIsFirefox] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const firefoxDetected = userAgent.includes('firefox')
    setIsFirefox(firefoxDetected)
  }, [])

  return (
    <>
      <nav className='fixed top-0 z-50 flex w-full items-center justify-between gap-6 bg-black/50 px-8 py-6 backdrop-blur-sm sm:pr-18 sm:pl-10'>
        <a href='/'>
          <Image
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
          {isFirefox && (
            <button
              onClick={() => setShowAlert(!showAlert)}
              className='group relative flex items-center gap-2 rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-orange-500/10 px-3 py-2 transition-all hover:border-amber-500/60 hover:from-amber-500/30 hover:to-orange-500/20'
              aria-label='Browser compatibility warning'
            >
              {/* Pulsing dot indicator */}
              <span className='absolute -top-1 -right-1 flex h-3 w-3'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75'></span>
                <span className='relative inline-flex h-3 w-3 rounded-full bg-amber-500'></span>
              </span>

              {/* Triangle warning icon */}
              <HiExclamationTriangle size={20} className='text-amber-400' />

              {/* Status text (hidden on mobile) */}
              <span className='hidden text-xs font-medium text-amber-400 sm:inline'>
                Status
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Alert Modal */}
      {showAlert && isFirefox && (
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
                <HiExclamationTriangle size={28} className='text-white' />
              </div>

              {/* Content */}
              <h3 className='mb-2 text-xl font-bold text-white'>
                Browser Compatibility Notice
              </h3>
              <p className='mb-4 text-sm text-gray-300'>
                The Spotify Web Player is currently not supported in Firefox due
                to browser restrictions with Enhanced Tracking Protection.
              </p>

              {/* Recommendations */}
              <div className='mb-4 rounded-xl border border-white/10 bg-white/5 p-4'>
                <p className='mb-2 text-xs font-semibold tracking-wider text-amber-400 uppercase'>
                  Recommended Browsers
                </p>
                <ul className='space-y-1 text-sm text-gray-300'>
                  <li className='flex items-center gap-2'>
                    <span className='text-green-400'>✓</span> Chrome
                  </li>
                  <li className='flex items-center gap-2'>
                    <span className='text-green-400'>✓</span> Microsoft Edge
                  </li>
                  <li className='flex items-center gap-2'>
                    <span className='text-green-400'>✓</span> Safari
                  </li>
                </ul>
              </div>

              {/* Alternative */}
              <p className='text-xs text-gray-400'>
                You can still browse playlists and open tracks directly in the
                Spotify app.
              </p>

              {/* Action button */}
              <button
                onClick={() => setShowAlert(false)}
                className='mt-4 w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]'
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
