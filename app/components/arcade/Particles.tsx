'use client'

import { useEffect, useRef } from 'react'
import { BURST_EVENT, reducedMotion, themeColors, type BurstDetail } from '@/lib/arcade'

type Bit = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  age: number
  spin: number
  coin: boolean
}

const GRAVITY = 980
const MAX_BITS = 420
const GOLD = { face: '#FFC83D', shine: '#FFF1A8', edge: '#C98517' }

/**
 * Pixel bursts, drawn on one canvas over the page that only runs while
 * something is flying. Anything can set one off with burst() (lib/arcade).
 */
export function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    let w = 0
    let h = 0
    let sized = false
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sized = true
    }

    const bits: Bit[] = []
    let raf = 0
    let last = 0

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      ctx.clearRect(0, 0, w, h)
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i]
        b.age += dt
        if (b.age >= b.life || b.y > h + 40) {
          bits.splice(i, 1)
          continue
        }
        b.vy += GRAVITY * dt
        b.vx *= 1 - 1.6 * dt
        b.x += b.vx * dt
        b.y += b.vy * dt
        const k = b.age / b.life
        ctx.globalAlpha = k < 0.65 ? 1 : Math.max(0, 1 - (k - 0.65) / 0.35)
        const x = Math.round(b.x - b.size / 2)
        const y = Math.round(b.y - b.size / 2)
        if (b.coin) {
          // a coin spinning: its width follows the turn
          const turn = Math.abs(Math.cos(b.age * 11 + b.spin))
          const cw = Math.max(2, Math.round(b.size * turn))
          const cx = Math.round(b.x - cw / 2)
          ctx.fillStyle = GOLD.edge
          ctx.fillRect(cx, y, cw, b.size)
          ctx.fillStyle = GOLD.face
          ctx.fillRect(cx + (cw > 4 ? 1 : 0), y + 1, Math.max(1, cw - (cw > 4 ? 2 : 0)), b.size - 2)
          if (cw > 5) {
            ctx.fillStyle = GOLD.shine
            ctx.fillRect(cx + 2, y + 2, 2, b.size - 5)
          }
        } else {
          ctx.fillStyle = b.color
          ctx.fillRect(x, y, b.size, b.size)
        }
      }
      ctx.globalAlpha = 1
      if (bits.length) {
        raf = requestAnimationFrame(frame)
      } else {
        raf = 0
        ctx.clearRect(0, 0, w, h)
        cv.style.visibility = 'hidden'
      }
    }

    const onBurst = (e: Event) => {
      const d = (e as CustomEvent<BurstDetail>).detail
      if (!d || reducedMotion()) return
      if (!sized) fit()
      const coin = d.kind === 'coins'
      const colors = d.colors?.length ? d.colors : [...themeColors(), '#ffffff']
      const count = Math.min(d.count ?? 18, 90)
      const power = d.power ?? 1
      for (let i = 0; i < count; i++) {
        // mostly up and out, like something popping
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5
        const speed = (140 + Math.random() * 300) * power
        bits.push({
          x: d.x + (Math.random() - 0.5) * 8,
          y: d.y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 120 * power,
          size: coin ? 10 + Math.round(Math.random() * 3) : 3 + Math.round(Math.random() * 3),
          color: colors[i % colors.length],
          life: 0.75 + Math.random() * 0.7,
          age: 0,
          spin: Math.random() * 6,
          coin
        })
      }
      if (bits.length > MAX_BITS) bits.splice(0, bits.length - MAX_BITS)
      if (!raf) {
        cv.style.visibility = 'visible'
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const onResize = () => {
      if (sized) fit()
    }

    window.addEventListener(BURST_EVENT, onBurst)
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener(BURST_EVENT, onBurst)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      // over everything, the GAME OVER screen included; hidden when idle
      className='pointer-events-none invisible fixed inset-0 z-[10000] h-full w-full'
    />
  )
}
