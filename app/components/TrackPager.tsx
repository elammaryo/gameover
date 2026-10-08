'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type AnimationPlaybackControls
} from 'motion/react'
import { usePlayerSelect } from '../providers/PlayBarProvider'
import { player } from '../providers/player'
import { EMPTY_QUEUE, currentItem, peekNext, peekPrev, type QueueItem } from '@/lib/queue'
import { cn } from '@/lib/utils'
import { SLOP, landingVelocity, rubberBand, track, velocityOf } from './gesture'

/** a flick this fast (px/s) turns the page however far it went */
const FLICK = 550
/** pages settle quickly and without a bounce, like a native pager */
const SETTLE = { type: 'spring', stiffness: 420, damping: 41, restDelta: 0.5, restSpeed: 8 } as const

type Slot = -1 | 0 | 1
type Page = { key: string; slot: Slot; item: QueueItem | null }

/**
 * The playing track as one page of a carousel, with the previous and next
 * tracks waiting either side (like Spotify). Swipe and the pages follow your
 * finger; let go past halfway, or flick, and the next or previous track
 * slides in and plays (swiping back always goes to the previous track; the
 * button restarts the track instead once it's a few seconds in). With
 * nothing that way the page gives a little and springs back. Skips from the
 * buttons, the queue or the end of a track slide over the same way.
 */
export function TrackPager({
  render,
  gap = 0,
  swipe = true,
  onSwipeUp,
  className
}: {
  /** a page: `item` is null for a next track that isn't known yet (going
   *  round a shuffled list again) */
  render: (item: QueueItem | null, current: boolean) => React.ReactNode
  /** space between pages, px */
  gap?: number
  /** follow swipes (phones); otherwise it only slides on changes */
  swipe?: boolean
  /** a flick upwards (the dock opens Now Playing) */
  onSwipeUp?: () => void
  className?: string
}) {
  const queue = usePlayerSelect(s => s.queue, EMPTY_QUEUE)
  const current = currentItem(queue)
  const prev = peekPrev(queue)
  const next = peekNext(queue)
  const canPrev = !!prev
  const canNext = !!next || (!!current && queue.repeat !== 'off')
  const reduced = useReducedMotion()

  const viewport = useRef<HTMLSpanElement>(null)
  const strip = useRef<HTMLSpanElement>(null)
  const x = useMotionValue(0)
  const anim = useRef<AnimationPlaybackControls | null>(null)
  const gesture = useRef<{
    id: number
    x0: number
    y0: number
    t0: number
    from: number
    lock: 'x' | null
    trail: Array<[number, number]>
  } | null>(null)
  // the release velocity of a swipe that just turned the page
  const flung = useRef<number | null>(null)
  // a swipe shouldn't also count as a tap on what's underneath
  const swiped = useRef(false)

  // The page on show, and the one leaving while the new one slides in (kept
  // beside it even when it isn't the neighbour any more, e.g. going round)
  const [view, setView] = useState<{
    item: QueueItem | null
    outgoing: QueueItem | null
    dir: -1 | 0 | 1
  }>(() => ({ item: current, outgoing: null, dir: 0 }))
  if ((view.item?.uid ?? null) !== (current?.uid ?? null)) {
    setView({ item: current, outgoing: view.item, dir: queue.direction })
  }

  // while the pages move, their edges fade out rather than being cut off
  useMotionValueEvent(x, 'change', v => {
    viewport.current?.toggleAttribute('data-moving', Math.abs(v) > 0.5)
  })

  const pageWidth = () => (viewport.current?.offsetWidth ?? 0) + gap

  const settle = (velocity: number) => {
    anim.current?.stop()
    const controls = animate(x, 0, {
      ...SETTLE,
      velocity: landingVelocity(x.get(), velocity, SETTLE.stiffness)
    })
    anim.current = controls
    controls.then(() => {
      if (anim.current !== controls) return
      anim.current = null
      setView(v => (v.outgoing ? { ...v, outgoing: null } : v))
    })
  }

  // The track changed: the old page is beside the new one now, so shift the
  // strip by a page (nothing moves this frame), then slide the new one in,
  // carrying on at the speed of the swipe if there was one
  useLayoutEffect(() => {
    if (!view.outgoing) return
    const velocity = flung.current ?? 0
    flung.current = null
    const w = pageWidth()
    const g = gesture.current
    if (view.dir === 0 || reduced || !w) {
      // a jump (or reduced motion): the new page just appears
      anim.current?.stop()
      anim.current = null
      if (g) g.from -= x.get()
      x.set(0)
      setView(v => (v.outgoing ? { ...v, outgoing: null } : v))
      return
    }
    const shifted = x.get() + view.dir * w
    x.set(shifted)
    if (strip.current) strip.current.style.transform = `translateX(${shifted}px)`
    if (g?.lock) {
      // mid-swipe (the track ended, or Spotify moved on): keep following
      g.from += view.dir * w
      return
    }
    settle(velocity)
    // (settle only reads refs and stable setters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  const onPointerDown = (e: React.PointerEvent) => {
    swiped.current = false
    if (!swipe || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    gesture.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      t0: e.timeStamp,
      from: 0,
      lock: null,
      trail: []
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || e.pointerId !== g.id) return
    if (!g.lock) {
      const dx = e.clientX - g.x0
      const dy = e.clientY - g.y0
      if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return
      if (Math.abs(dy) >= Math.abs(dx)) {
        // up or down: not ours (the sheet closes on a pull down)
        gesture.current = null
        if (dy < 0 && onSwipeUp) {
          swiped.current = true
          onSwipeUp()
        }
        return
      }
      g.lock = 'x'
      swiped.current = true
      // catch a page that's still settling where it is
      anim.current?.stop()
      anim.current = null
      g.from = x.get()
      // follow from the edge of the slop (a quick flick can cover it all
      // in one move), and count from the touch for the flick's speed
      g.x0 += Math.sign(dx) * SLOP
      track(g.trail, g.t0, g.from)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // (the pointer is already gone)
      }
    }
    let to = g.from + (e.clientX - g.x0)
    if ((to < 0 && !canNext) || (to > 0 && !canPrev)) to = rubberBand(to, pageWidth())
    x.set(to)
    track(g.trail, e.timeStamp, to)
  }

  const onPointerEnd = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || e.pointerId !== g.id) return
    gesture.current = null
    if (!g.lock) return
    const cancelled = e.type === 'pointercancel'
    const velocity = cancelled ? 0 : velocityOf(g.trail, e.timeStamp)
    const at = x.get()
    const w = pageWidth()
    const projected = at + velocity * 0.2
    let dir: 1 | -1 | 0 = 0
    if (!cancelled && canNext && at < -SLOP && (projected < -w / 2 || velocity < -FLICK)) dir = 1
    else if (!cancelled && canPrev && at > SLOP && (projected > w / 2 || velocity > FLICK)) dir = -1
    if (dir) {
      const before = currentItem(player.getState().queue)?.uid
      flung.current = velocity
      if (dir === 1) player.next()
      else player.prevTrack()
      // the change re-renders before the next frame and slides on from here
      if (currentItem(player.getState().queue)?.uid !== before) return
      flung.current = null
    }
    settle(velocity)
  }

  // the pages: this one, and either side of it whatever "previous" and
  // "next" would play (or the page that's just leaving)
  const pages: Page[] = []
  const used = new Set<string>()
  const add = (slot: Slot, item: QueueItem | null, fallback: string) => {
    let key = item?.uid ?? fallback
    if (used.has(key)) key = `${key}:${slot}`
    used.add(key)
    pages.push({ key, slot, item })
  }
  if (current) add(0, current, 'current')
  const leaving = view.outgoing && view.dir !== 0 ? view.outgoing : null
  const left = leaving && view.dir === 1 ? leaving : prev
  const right = leaving && view.dir === -1 ? leaving : next
  if (left) add(-1, left, 'prev')
  if (right || canNext) add(1, right, 'next')
  const jumpedIn = view.dir === 0 && !!view.outgoing

  return (
    <span
      ref={viewport}
      data-pager
      className={cn(
        'relative block overflow-x-clip',
        'data-moving:[mask-image:linear-gradient(90deg,transparent,#000_14px,#000_calc(100%_-_14px),transparent)]',
        swipe && 'select-none [-webkit-touch-callout:none]',
        swipe && (onSwipeUp ? 'touch-none' : 'touch-pan-y'),
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={e => {
        // (a click from the keyboard is never a swipe)
        if (!swiped.current || e.detail === 0) return
        e.preventDefault()
        e.stopPropagation()
      }}
      // a page's links and images shouldn't start their own drags
      onDragStart={e => e.preventDefault()}
    >
      <motion.span ref={strip} style={{ x }} className='relative block'>
        {pages.map(({ key, slot, item }) => (
          <span
            key={key}
            data-page={slot}
            aria-hidden={slot !== 0 || undefined}
            inert={slot !== 0}
            className={slot === 0 ? 'relative block' : 'absolute inset-0 block'}
            style={
              slot
                ? { transform: `translateX(calc(${slot * 100}% + ${slot * gap}px))` }
                : undefined
            }
          >
            <motion.span
              className='block'
              initial={slot === 0 && jumpedIn ? { opacity: 0, scale: 0.97 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 460, damping: 38 }}
            >
              {render(item, slot === 0)}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </span>
  )
}
