'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { usePlayerSelect } from '../../providers/PlayBarProvider'
import { burst, recentGesture } from '@/lib/arcade'
import { readSfx, sfx } from '@/lib/sfx'
import { TROPHY_EVENT, trophyById, type TrophyId } from '@/lib/trophies'
import { cn } from '@/lib/utils'
import { TrophyIcon } from './TrophyIcon'

const SHOW_MS = 4600
const GAP_MS = 380
const GOLD = ['#FFC83D', '#FFF1A8', '#FF9F2E', '#ffffff']

/**
 * "Achievement unlocked", one at a time: bottom left on bigger screens (clear
 * of the Now Playing panel on the right and the player's own notes in the
 * middle), under the nav on phones. Chimes if it came from something you
 * just did and sound is on.
 */
export function TrophyToast() {
  const [shown, setShown] = useState<{ key: number; id: TrophyId; top: boolean } | null>(null)
  const tile = useRef<HTMLSpanElement>(null)
  const docked = usePlayerSelect(s => s.queue.index >= 0, false)

  useEffect(() => {
    const queue: TrophyId[] = []
    let busy = false
    let timer = 0
    let key = 0

    const next = () => {
      const id = queue.shift()
      if (!id) {
        busy = false
        return
      }
      busy = true
      const top = window.matchMedia('(max-width: 639px)').matches
      setShown({ key: ++key, id, top })
      if (readSfx() && recentGesture()) sfx()?.trophy()
      timer = window.setTimeout(() => {
        setShown(null)
        timer = window.setTimeout(next, GAP_MS)
      }, SHOW_MS)
    }

    const onTrophy = (e: Event) => {
      const id = (e as CustomEvent<{ id: TrophyId }>).detail?.id
      if (!id) return
      queue.push(id)
      if (!busy) next()
    }
    window.addEventListener(TROPHY_EVENT, onTrophy)
    return () => {
      window.removeEventListener(TROPHY_EVENT, onTrophy)
      window.clearTimeout(timer)
    }
  }, [])

  // sparks fly off the trophy as it lands
  useEffect(() => {
    if (!shown) return
    const t = window.setTimeout(() => {
      const r = tile.current?.getBoundingClientRect()
      if (r) {
        burst({
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          count: 22,
          colors: GOLD,
          power: 0.75
        })
      }
    }, 240)
    return () => window.clearTimeout(t)
  }, [shown])

  const trophy = shown ? trophyById(shown.id) : null

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn(
        'pointer-events-none fixed inset-x-0 top-[calc(var(--nav-h)+0.75rem)] z-[66] flex justify-center px-4 transition-[bottom] duration-300 sm:top-auto sm:justify-start sm:px-6',
        // above the player's own notes (bottom centre) until there's room
        // beside them
        docked
          ? 'sm:bottom-[11.25rem] xl:bottom-[7.25rem]'
          : 'sm:bottom-[5.25rem] xl:bottom-6'
      )}
    >
      <AnimatePresence>
        {shown && trophy && (
          <motion.div
            key={shown.key}
            initial={{ opacity: 0, y: shown.top ? -22 : 26, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: shown.top ? -12 : 14,
              scale: 0.96,
              transition: { duration: 0.2 }
            }}
            transition={{ type: 'spring', stiffness: 440, damping: 28 }}
            // phones: it's just news; a tap aimed at the page mustn't open it
            className='w-full max-w-[23rem] sm:pointer-events-auto'
          >
            <Link
              href='/about#trophies'
              className='surface-raised group/toast flex items-center gap-3.5 rounded-2xl bg-ink-900/96! p-3 pr-4 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.95),0_0_0_1px_rgb(255_200_61/0.12)] backdrop-blur-xl transition-colors hover:border-warn/40'
            >
              <span
                ref={tile}
                className='relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#FFE08A,#FFB547_45%,#FF8A2E)] text-ink-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.5),0_10px_26px_-10px_rgb(255_181_71/0.9)]'
              >
                <TrophyIcon id={trophy.id} className='size-[22px]' />
                <span
                  aria-hidden
                  className='trophy-glint absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/75 to-transparent'
                />
              </span>
              <span className='min-w-0 flex-1'>
                <span className='trophy-type block font-pixel text-[10px] tracking-[0.24em] text-warn uppercase'>
                  Achievement unlocked
                </span>
                <span className='font-display-tight mt-1 block truncate text-[17px] text-bone'>
                  {trophy.name}
                </span>
                <span className='line-clamp-2 block text-[12.5px] leading-snug text-bone-dim'>
                  {trophy.done}
                </span>
              </span>
              <span className='tabular shrink-0 self-start pt-0.5 font-mono text-[11px] text-warn'>
                +{trophy.points} G
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
