'use client'

import { useEffect, useEffectEvent } from 'react'
import { animate, type AnimationPlaybackControls, type MotionValue } from 'motion/react'
import { SLOP, landingVelocity, track, velocityOf } from './gesture'

/** a pull this fast (px/s) closes the sheet however far it went */
const FLICK = 700
/** pulled down past this share of its height (counting the throw), it closes */
const CLOSE_AT = 0.3

/**
 * Pull a full-screen sheet down to close it (phones): it follows the finger
 * from anywhere on it (sliders and drag handles keep their own gestures,
 * and a list that's scrolled down scrolls back up first). Let go far
 * enough down, or flick it, and it closes (the exit animation carries on at
 * the finger's speed); otherwise it springs back up.
 *
 * Touches are read as touch events, so the sheet can keep the page from
 * scrolling once a pull is its; a mouse or pen works the same way.
 */
export function useSheetDrag({
  sheet,
  scroller,
  y,
  onClose
}: {
  sheet: React.RefObject<HTMLElement | null>
  /** the scrolling part: pulls inside it only count from its top */
  scroller: React.RefObject<HTMLElement | null>
  y: MotionValue<number>
  onClose: () => void
}) {
  const close = useEffectEvent(onClose)

  useEffect(() => {
    const el = sheet.current
    if (!el) return
    let g: {
      id: string
      x0: number
      y0: number
      t0: number
      from: number
      pulling: boolean
      atTop: boolean
      trail: Array<[number, number]>
    } | null = null
    let spring: AnimationPlaybackControls | null = null
    let draggedAt = 0

    const begin = (
      id: string,
      x: number,
      yy: number,
      time: number,
      target: EventTarget | null
    ) => {
      g = null
      if (!(target instanceof Element)) return
      // these have their own gestures
      if (target.closest('[role="slider"], [data-volume-slider], [data-no-sheet-drag]')) return
      const list = scroller.current
      const atTop = !list?.contains(target) || list.scrollTop <= 0
      g = { id, x0: x, y0: yy, t0: time, from: 0, pulling: false, atTop, trail: [] }
    }

    /** true while the sheet has this gesture (so the page mustn't scroll) */
    const move = (x: number, yy: number, time: number) => {
      if (!g) return false
      if (!g.pulling) {
        const dx = x - g.x0
        const dy = yy - g.y0
        if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return false
        // only straight-ish pulls down; sideways is the artwork's swipe, up
        // (or down a list that isn't at its top) is scrolling
        if (!(dy > 0 && dy > Math.abs(dx) && g.atTop)) {
          g = null
          return false
        }
        g.pulling = true
        spring?.stop()
        spring = null
        g.from = y.get()
        // follow from the edge of the slop, timing the throw from the touch
        g.y0 += SLOP
        track(g.trail, g.t0, g.from)
      }
      const to = Math.max(0, g.from + (yy - g.y0))
      y.set(to)
      track(g.trail, time, to)
      return true
    }

    const end = (time: number, cancelled: boolean) => {
      const done = g
      g = null
      if (!done?.pulling) return
      draggedAt = performance.now()
      const velocity = cancelled ? 0 : velocityOf(done.trail, time)
      const at = y.get()
      const h = el.offsetHeight || window.innerHeight
      const thrown = at + velocity * 0.2
      if (!cancelled && velocity > -150 && (thrown > h * CLOSE_AT || (velocity > FLICK && at > SLOP))) {
        close()
      } else {
        spring = animate(y, 0, {
          type: 'spring',
          stiffness: 420,
          damping: 41,
          velocity: landingVelocity(at, velocity, 420)
        })
      }
    }

    const touchOf = (e: TouchEvent) =>
      g ? Array.from(e.changedTouches).find(t => `t${t.identifier}` === g!.id) : undefined

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        // a second finger (pinch): let it be
        if (g?.pulling) end(e.timeStamp, true)
        g = null
        return
      }
      const t = e.changedTouches[0]
      begin(`t${t.identifier}`, t.clientX, t.clientY, e.timeStamp, e.target)
    }
    const onTouchMove = (e: TouchEvent) => {
      const t = touchOf(e)
      if (t && move(t.clientX, t.clientY, e.timeStamp) && e.cancelable) e.preventDefault()
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (touchOf(e)) end(e.timeStamp, e.type === 'touchcancel')
    }

    // mouse and pen (touches come through the touch events above)
    const onPointerMove = (e: PointerEvent) => {
      if (g?.id === `p${e.pointerId}` && move(e.clientX, e.clientY, e.timeStamp)) {
        e.preventDefault()
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      if (g?.id !== `p${e.pointerId}`) return
      end(e.timeStamp, e.type === 'pointercancel')
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !e.isPrimary || e.button !== 0) return
      begin(`p${e.pointerId}`, e.clientX, e.clientY, e.timeStamp, e.target)
      if (!g) return
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
    }

    // letting go after a pull isn't a tap on whatever is under the finger
    const onClick = (e: MouseEvent) => {
      if (performance.now() - draggedAt > 350) return
      e.preventDefault()
      e.stopPropagation()
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('click', onClick, true)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('click', onClick, true)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      spring?.stop()
    }
  }, [sheet, scroller, y])
}
