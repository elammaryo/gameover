'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { TRANSITION_EVENT } from '@/lib/transition'
import { cn } from '@/lib/utils'
import { Mark } from './brand/Mark'

/** Full-screen "loading" moment between the landing page and the studio. */
export function TransitionOverlay() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('Loading')
  const openedOn = useRef<string | null>(null)

  useEffect(() => {
    const onStart = (event: Event) => {
      const detail = (event as CustomEvent<{ label?: string }>).detail
      openedOn.current = window.location.pathname
      setLabel(detail?.label ?? 'Loading')
      setOpen(true)
    }
    window.addEventListener(TRANSITION_EVENT, onStart)
    return () => window.removeEventListener(TRANSITION_EVENT, onStart)
  }, [])

  // close once the destination route has rendered
  useEffect(() => {
    if (!open || openedOn.current === pathname) return
    const t = window.setTimeout(() => setOpen(false), 160)
    return () => window.clearTimeout(t)
  }, [pathname, open])

  // never trap anyone behind the overlay
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => setOpen(false), 4000)
    return () => window.clearTimeout(t)
  }, [open])

  return (
    <div
      aria-hidden={!open}
      role={open ? 'status' : undefined}
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center bg-ink-950 transition-opacity duration-300',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      {open && (
        <div className='flex flex-col items-center gap-7'>
          <Mark motion='loop' showUnlit className='size-20' />
          <p className='font-pixel text-[11px] tracking-[0.32em] text-bone-muted uppercase'>
            {label}
            <span className='animate-blink'>_</span>
          </p>
        </div>
      )}
    </div>
  )
}
