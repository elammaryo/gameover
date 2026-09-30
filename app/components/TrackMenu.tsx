'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ListEnd, ListPlus, MoreHorizontal } from 'lucide-react'
import type { Track } from '../models/Track'
import { player } from '../providers/player'
import { cn } from '@/lib/utils'

const WIDTH = 212
const ITEM_H = 42
/** keep the menu clear of the player dock */
const BOTTOM_GAP = 104

const noSubscribe = () => () => {}

type Pos = { top: number; left: number; below: boolean }

const ITEM_COUNT = 2

/** Below the button, or above it when the dock would be in the way. */
function placeFor(r: DOMRect): Pos {
  const h = ITEM_COUNT * ITEM_H + 12
  const below = r.bottom + 6 + h < window.innerHeight - BOTTOM_GAP
  return {
    top: below ? r.bottom + 6 : Math.max(8, r.top - 6 - h),
    left: Math.max(8, Math.min(window.innerWidth - WIDTH - 8, r.right - WIDTH)),
    below
  }
}

/**
 * "⋯" on a track: Play next / Add to queue. The menu is portalled to the
 * body (rows and panels clip), placed below the button, or above it when
 * there's no room, and works from the keyboard like a native menu.
 */
export function TrackMenu({
  track,
  className
}: {
  track: Track
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<Pos | null>(null)
  const button = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const id = useId()
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)

  const items = [
    { label: 'Play next', icon: ListEnd, run: () => player.playNext(track) },
    { label: 'Add to queue', icon: ListPlus, run: () => player.addToQueue(track) }
  ]

  const openMenu = () => {
    const r = button.current?.getBoundingClientRect()
    if (!r) return
    setPos(placeFor(r))
    setOpen(true)
  }

  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) button.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menu.current?.contains(t) && !button.current?.contains(t)) setOpen(false)
    }
    // the menu follows its button while the page scrolls (a scroll still
    // coasting when you tap shouldn't shut it); it closes once the button
    // has left the screen
    let follow = 0
    const reposition = () => {
      cancelAnimationFrame(follow)
      follow = requestAnimationFrame(() => {
        const r = button.current?.getBoundingClientRect()
        if (!r || r.bottom < 0 || r.top > window.innerHeight) setOpen(false)
        else setPos(placeFor(r))
      })
    }
    window.addEventListener('pointerdown', onPointer, true)
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    const raf = requestAnimationFrame(() =>
      menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true })
    )
    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(follow)
      window.removeEventListener('pointerdown', onPointer, true)
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open])

  const onMenuKey = (e: React.KeyboardEvent) => {
    const list = Array.from(
      menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    )
    const at = list.indexOf(document.activeElement as HTMLElement)
    const focus = (i: number) => list[(i + list.length) % list.length]?.focus()
    if (e.key === 'ArrowDown') focus(at + 1)
    else if (e.key === 'ArrowUp') focus(at - 1)
    else if (e.key === 'Home') focus(0)
    else if (e.key === 'End') focus(list.length - 1)
    else if (e.key === 'Escape' || e.key === 'Tab') close(true)
    else return
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      <button
        ref={button}
        type='button'
        aria-label={`More options for ${track.title}`}
        aria-haspopup='menu'
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={e => {
          e.stopPropagation()
          if (open) close(false)
          else openMenu()
        }}
        className={cn(
          'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-bone-dim transition-[color,background-color,opacity] duration-150 hover:bg-white/[0.08] hover:text-bone focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-live focus-visible:outline-none aria-expanded:bg-white/[0.08] aria-expanded:text-bone aria-expanded:opacity-100',
          className
        )}
      >
        <MoreHorizontal className='size-[18px]' />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={menu}
                id={id}
                role='menu'
                aria-label={track.title}
                onKeyDown={onMenuKey}
                initial={{ opacity: 0, scale: 0.94, y: pos.below ? -6 : 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 620, damping: 36 }}
                style={{
                  top: pos.top,
                  left: pos.left,
                  width: WIDTH,
                  transformOrigin: pos.below ? 'top right' : 'bottom right'
                }}
                className='surface-raised fixed z-[70] rounded-xl bg-ink-900/95! p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.95)] backdrop-blur-xl'
              >
                {items.map(({ label, icon: Icon, run }) => (
                  <button
                    key={label}
                    type='button'
                    role='menuitem'
                    tabIndex={-1}
                    onClick={() => {
                      run()
                      close(true)
                    }}
                    className='flex h-[42px] w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-bone transition-colors outline-none hover:bg-white/[0.07] focus-visible:bg-white/[0.09]'
                  >
                    <Icon className='size-4 text-bone-muted' />
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
