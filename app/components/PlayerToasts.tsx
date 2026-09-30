'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, ListEnd, ListPlus } from 'lucide-react'
import { TOAST_EVENT, type ToastDetail } from '@/lib/toast'
import { cn } from '@/lib/utils'

type Item = ToastDetail & { id: number }

const LIFETIME = 2600
const MAX = 3

function iconFor(t: Item) {
  if (t.tone === 'warn') return AlertTriangle
  if (/next/i.test(t.text)) return ListEnd
  return ListPlus
}

/**
 * Little confirmations just above the player ("Added to queue", "Skipped a
 * beat that wouldn't load"). Anything can raise one with toast() from
 * lib/toast.
 */
export function PlayerToasts({ docked }: { docked: boolean }) {
  const [items, setItems] = useState<Item[]>([])
  const seq = useRef(0)

  useEffect(() => {
    const timers = new Set<number>()
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastDetail>).detail
      if (!detail?.text) return
      const id = ++seq.current
      setItems(list => [...list.slice(-(MAX - 1)), { ...detail, id }])
      const t = window.setTimeout(() => {
        timers.delete(t)
        setItems(list => list.filter(i => i.id !== id))
      }, LIFETIME)
      timers.add(t)
    }
    window.addEventListener(TOAST_EVENT, onToast)
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast)
      timers.forEach(t => window.clearTimeout(t))
    }
  }, [])

  return (
    <div
      role='status'
      aria-live='polite'
      // stays announced while the phone sheet makes the page inert
      data-keep-live
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[62] flex flex-col items-center gap-2 px-4 transition-[bottom] duration-300',
        docked
          ? 'bottom-[calc(5.25rem+var(--safe-area-inset-bottom))] sm:bottom-[7.25rem]'
          : 'bottom-[calc(1.25rem+var(--safe-area-inset-bottom))]'
      )}
    >
      <AnimatePresence initial={false}>
        {items.map(t => {
          const Icon = iconFor(t)
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96, transition: { duration: 0.16 } }}
              transition={{ type: 'spring', stiffness: 520, damping: 34 }}
              className='surface-raised flex max-w-[min(92vw,26rem)] items-center gap-3 rounded-full bg-ink-900/90! py-2 pr-4 pl-2.5 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.9)] backdrop-blur-xl'
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full',
                  t.tone === 'warn' ? 'bg-warn/15 text-warn' : 'bg-live/15 text-live'
                )}
              >
                <Icon className='size-3.5' />
              </span>
              <span className='min-w-0 text-sm leading-tight'>
                <span className='font-semibold text-bone'>{t.text}</span>
                {t.detail && (
                  <span className='block truncate text-xs text-bone-dim'>{t.detail}</span>
                )}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
