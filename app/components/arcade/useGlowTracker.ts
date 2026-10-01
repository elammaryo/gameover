'use client'

import { useEffect } from 'react'

/* ---------------------------------------------------------------------------
   Keeps every glow card's light where the pointer is (see "Glow cards" in
   globals.css). One listener for the whole site: on each frame the pointer
   moved (or the page scrolled under it) the card under it gets --mx / --my.

   On touch screens there's no hover, so a press lights the card instead:
   briefly, and not at all if the touch turns out to be a scroll.
--------------------------------------------------------------------------- */

const CARD = '.glow-card'
/** a touch that's still down (and still) after this is a press, not a scroll */
const PRESS_AFTER = 90
const PRESS_HOLD = 420
/** px a touch can wander before it counts as a scroll */
const SLOP = 8

function placeLight(card: Element, x: number, y: number) {
  const r = card.getBoundingClientRect()
  const style = (card as HTMLElement).style
  style.setProperty('--mx', `${Math.round(x - r.left)}px`)
  style.setProperty('--my', `${Math.round(y - r.top)}px`)
}

export function useGlowTracker() {
  useEffect(() => {
    let raf = 0
    let x = 0
    let y = 0
    let tracking = false

    const frame = () => {
      raf = 0
      if (!tracking) return
      const card = document.elementFromPoint(x, y)?.closest(CARD)
      if (card) placeLight(card, x, y)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        // the finger's moving: it's a scroll starting, not a press
        if (e.pointerId === downId && pending) {
          if (Math.hypot(e.clientX - downX, e.clientY - downY) > SLOP) release()
        }
        return
      }
      x = e.clientX
      y = e.clientY
      tracking = true
      schedule()
    }
    const onScroll = () => {
      if (tracking) schedule()
    }
    const onLeave = (e: PointerEvent) => {
      // left the window
      if (!e.relatedTarget) tracking = false
    }

    // --- touch: light the card you press --------------------------------------
    let downId = -1
    let downX = 0
    let downY = 0
    let pending: HTMLElement | null = null
    let pressed: HTMLElement | null = null
    let pressTimer = 0
    let releaseTimer = 0

    const release = () => {
      window.clearTimeout(pressTimer)
      window.clearTimeout(releaseTimer)
      if (pressed) delete pressed.dataset.glowPress
      pressed = null
      pending = null
    }
    const press = (card: HTMLElement) => {
      pressed = card
      card.dataset.glowPress = ''
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || !e.isPrimary) return
      release()
      const target = e.target
      const card = target instanceof Element ? target.closest<HTMLElement>(CARD) : null
      if (!card) return
      placeLight(card, e.clientX, e.clientY)
      downId = e.pointerId
      downX = e.clientX
      downY = e.clientY
      pending = card
      pressTimer = window.setTimeout(() => press(card), PRESS_AFTER)
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== downId || !pending) return
      window.clearTimeout(pressTimer)
      // a quick tap: light it now
      if (!pressed) press(pending)
      releaseTimer = window.setTimeout(release, PRESS_HOLD)
    }
    const onCancel = (e: PointerEvent) => {
      // the touch became a scroll
      if (e.pointerId === downId) release()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerout', onLeave, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onCancel, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      release()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onLeave)
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
  }, [])
}
