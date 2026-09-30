'use client'

import { useEffect, useRef, useState } from 'react'
import { readBeat } from '@/lib/beatClock'
import { LOGO_GLITCH_EVENT } from '@/lib/stage'
import { cn } from '@/lib/utils'
import { G_FRAG, G_VERT } from './gShader'

/** distance field of the G (scripts/build-g-icon.py) */
const G_SDF = { url: '/brand/g-sdf.png', size: 512, distMin: -43.2676, distMax: 93.7465 }
/** the GAMEOVER title's gradient: cyan, violet, magenta */
const BRAND = ['#19E4F9', '#5A70DF', '#C83ADE']
/** pre-rendered frame for browsers without WebGL 2 */
const FALLBACK = '/brand/gameover-g-chrome-256.png'

const hexToRgb = (hex: string) =>
  [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)

const TAU = Math.PI * 2

/**
 * The GameOver G, live: liquid chrome in the title's colours that
 * materialises from pixels, leans toward your pointer, flips like a coin
 * when you point at it (and every four bars of a playing beat), bounces on
 * the kick and glitches now and then. `mode="coin"` keeps it spinning,
 * like a coin waiting to be collected (the loading screens use this).
 */
export function GIcon({
  className,
  mode = 'idle',
  label = 'GameOver',
  fit = 0.95
}: {
  className?: string
  mode?: 'idle' | 'coin'
  /** null when decorative */
  label?: string | null
  /** how much of the box the glyph's texture fills */
  fit?: number
}) {
  const host = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState(false)
  const modeRef = useRef(mode)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    const el = host.current
    if (!el) return
    // a canvas per mount: its context is thrown away on cleanup, and a
    // remount (StrictMode, Fast Refresh) must not inherit a lost context
    const cv = document.createElement('canvas')
    cv.setAttribute('aria-hidden', 'true')
    cv.className = 'absolute inset-0 h-full w-full'
    el.prepend(cv)
    let disposed = false
    const gl = cv.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false
    })
    if (!gl) {
      cv.remove()
      setFallback(true)
      return
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s) ?? 'shader error')
      return s
    }
    let program: WebGLProgram
    try {
      program = gl.createProgram()!
      gl.attachShader(program, compile(gl.VERTEX_SHADER, G_VERT))
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, G_FRAG))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link')
    } catch (err) {
      console.warn('G icon shader unavailable, using the still', err)
      cv.remove()
      setFallback(true)
      return
    }
    gl.useProgram(program)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)

    const u = (name: string) => gl.getUniformLocation(program, name)
    const U = {
      res: u('uRes'),
      time: u('uTime'),
      tilt: u('uTilt'),
      boot: u('uBoot'),
      glitch: u('uGlitch'),
      kick: u('uKick'),
      spin: u('uSpin')
    }
    gl.uniform1i(u('uSdf'), 0)
    gl.uniform1f(u('uTexSize'), G_SDF.size)
    gl.uniform2f(u('uDist'), G_SDF.distMin, G_SDF.distMax)
    gl.uniform1f(u('uTile'), 0)
    gl.uniform1f(u('uFit'), fit)
    const [c0, c1, c2] = BRAND.map(hexToRgb)
    gl.uniform3fv(u('uC0'), c0)
    gl.uniform3fv(u('uC1'), c1)
    gl.uniform3fv(u('uC2'), c2)

    // --- state ---------------------------------------------------------------
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let ready = false
    let visible = true
    let raf = 0
    let last = performance.now()
    const t0 = last
    let bootStart = 0
    let glitchUntil = 0
    let glitchAmp = 0
    let nextGlitch = last + 3000 + Math.random() * 4000
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 }
    let spin = 0
    let flipFrom = -1 // start time of a flip, -1 when not flipping
    let lastBar = -1
    let playing = 0

    const resize = () => {
      const w = Math.max(1, Math.round(el.clientWidth * dpr))
      const h = Math.max(1, Math.round(el.clientHeight * dpr))
      if (cv.width !== w || cv.height !== h) {
        cv.width = w
        cv.height = h
        gl.viewport(0, 0, w, h)
      }
      gl.uniform2f(U.res, w, h)
    }

    const burst = (amp: number, ms: number) => {
      if (reduce.matches) return
      glitchAmp = amp
      glitchUntil = performance.now() + ms
    }
    const flip = () => {
      if (reduce.matches || modeRef.current === 'coin' || flipFrom >= 0) return
      flipFrom = performance.now()
    }

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const still = reduce.matches

      if (!still && modeRef.current === 'idle' && now > nextGlitch) {
        burst(0.3 + Math.random() * 0.3, 80 + Math.random() * 120)
        nextGlitch = now + 5000 + Math.random() * 6000
      }
      const glitch = now < glitchUntil ? glitchAmp * (0.55 + 0.45 * Math.random()) : 0

      tilt.x += (tilt.tx - tilt.x) * 0.08
      tilt.y += (tilt.ty - tilt.y) * 0.08

      const beat = readBeat()
      playing += ((beat.playing ? 1 : 0) - playing) * 0.1
      // a flip on the downbeat of every fourth bar
      if (beat.playing && !still) {
        const bar = Math.floor(beat.beats / 16)
        if (bar !== lastBar && beat.beats % 16 < 0.25 && lastBar >= 0) flip()
        lastBar = bar
      }

      if (still) {
        spin = 0
      } else if (modeRef.current === 'coin') {
        spin += dt * TAU * 0.8
      } else if (flipFrom >= 0) {
        const k = Math.min(1, (now - flipFrom) / 950)
        // ease out with a little overshoot, like a coin settling
        const e = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2)
        spin = TAU * e
        if (k >= 1) {
          flipFrom = -1
          spin = 0
        }
      } else {
        spin = 0
      }

      const boot = still ? 1 : Math.min(1, bootStart ? (now - bootStart) / 900 : 0)

      gl.uniform1f(U.time, still ? 2.2 : (now - t0) / 1000)
      gl.uniform2f(U.tilt, still ? 0 : tilt.x, still ? 0 : tilt.y)
      gl.uniform1f(U.boot, boot)
      gl.uniform1f(U.glitch, glitch)
      gl.uniform1f(U.kick, still ? 0 : beat.kick * playing)
      gl.uniform1f(U.spin, spin)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const loop = (now: number) => {
      raf = 0
      if (disposed || !ready || !visible || document.hidden) return
      draw(now)
      // reduced motion: one settled frame (redrawn on resize)
      if (!reduce.matches) raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(loop)
    }

    // --- texture -------------------------------------------------------------
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (disposed) return
      const tex = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      ready = true
      bootStart = performance.now() + 60
      resize()
      wake()
    }
    img.onerror = () => {
      if (disposed) return
      cv.remove()
      setFallback(true)
    }
    img.src = G_SDF.url

    // --- listeners -----------------------------------------------------------
    const ro = new ResizeObserver(() => {
      resize()
      wake()
    })
    ro.observe(el)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) wake()
    })
    io.observe(el)
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = el.getBoundingClientRect()
      const span = Math.max(window.innerWidth, window.innerHeight) * 0.5
      tilt.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / span))
      tilt.ty = Math.max(-1, Math.min(1, -(e.clientY - (r.top + r.height / 2)) / span))
    }
    const onEnter = () => {
      flip()
      burst(0.5, 160)
    }
    const onGlitch = () => burst(1, 420)
    const onVisibility = () => wake()
    window.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerenter', onEnter)
    window.addEventListener(LOGO_GLITCH_EVENT, onGlitch)
    document.addEventListener('visibilitychange', onVisibility)
    reduce.addEventListener('change', wake)

    return () => {
      disposed = true
      img.onload = null
      img.onerror = null
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerenter', onEnter)
      window.removeEventListener(LOGO_GLITCH_EVENT, onGlitch)
      document.removeEventListener('visibilitychange', onVisibility)
      reduce.removeEventListener('change', wake)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      cv.remove()
    }
  }, [fit])

  return (
    <div
      ref={host}
      role={label ? 'img' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={cn('relative aspect-square select-none', className)}
    >
      {fallback && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={FALLBACK} alt='' className='absolute inset-0 h-full w-full' />
      )}
    </div>
  )
}
