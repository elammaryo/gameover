'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useIsPlaying } from '../providers/PlayBarProvider'
import { GIcon } from './brand/GIcon'
import { readSfx, sfx } from '@/lib/sfx'
import {
  LOGO_GLITCH_EVENT,
  STAGES,
  STAGE_EVENT,
  STAGE_REVEAL_EVENT,
  type StageDetail,
  type StageId
} from '@/lib/stage'
import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------------------
   "Loading the next stage". Pressing start on the title screen opens a
   portal from the button into a field of LEDs rushing past, the stage card
   slams in over a 16-step sequencer that fills like a loading bar (a trap
   hi-hat roll, if sound is on), and on the drop (an 808) the black screen
   breaks into pixels to reveal the page, which takes the hit.

   Timeline (ms after the press):
     0     portal opens, logo glitches, start chime
     300   sequencer + hat roll begin (32nd notes at 140 BPM)
     520   navigate (the new page renders underneath, entrances paused)
     ~1200 roll done: reveal as soon as the new page is there
   Click, Enter, Space or Escape skips ahead.
--------------------------------------------------------------------------- */

const BPM = 140
const STEP = 60 / BPM / 8 // one 32nd note, seconds
const ROLL_AT = 0.3 // seconds
const PUSH_AT = 520 // ms
const COVERED_AT = 700 // ms: the portal has filled the screen
const MIN_REVEAL = Math.round((ROLL_AT + 16 * STEP) * 1000) + 30
const REVEAL_MS = 820
const GIVE_UP = 7000
const SKIP_AFTER = 400 // ms: a double-click on START shouldn't skip the show

type Run = StageDetail & { id: number; from: string; at: number }

export function StageTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const isPlaying = useIsPlaying()
  const playingRef = useRef(isPlaying)
  const [run, setRun] = useState<Run | null>(null)
  const [ready, setReady] = useState(false)
  const runRef = useRef<Run | null>(null)
  const pushed = useRef(false)
  const audio = useRef<ReturnType<typeof sfx>>(null)

  useEffect(() => {
    playingRef.current = isPlaying
  }, [isPlaying])

  const go = () => {
    const current = runRef.current
    if (!current || pushed.current) return
    pushed.current = true
    router.push(current.href)
  }

  const finish = () => {
    delete document.documentElement.dataset.stage
    delete document.documentElement.dataset.stageCovered
    runRef.current = null
    setRun(null)
  }

  const skip = () => {
    const current = runRef.current
    if (!current || performance.now() - current.at < SKIP_AFTER) return
    go()
    setReady(true)
  }

  const onPushTime = useEffectEvent(go)
  const onFinish = useEffectEvent(finish)
  const onSkip = useEffectEvent(skip)

  // start a run
  useEffect(() => {
    const onStage = (event: Event) => {
      // tell enterStage() the event was handled (it navigates itself if not)
      event.preventDefault()
      if (runRef.current) return
      const detail = (event as CustomEvent<StageDetail>).detail
      const next: Run = {
        ...detail,
        id: Date.now(),
        from: window.location.pathname,
        at: performance.now()
      }
      runRef.current = next
      pushed.current = false
      document.documentElement.dataset.stage = 'on'
      router.prefetch(detail.href)
      window.dispatchEvent(new Event(LOGO_GLITCH_EVENT))

      // sound, if wanted and nothing is playing already
      const a = readSfx() && !playingRef.current ? sfx() : null
      audio.current = a
      if (a) {
        a.start(0)
        // the roll speeds up: 16ths, then 32nds, then 64ths into the drop
        for (let i = 0; i < 16; i++) {
          const t = ROLL_AT + i * STEP
          const velocity = 0.45 + (i / 15) * 0.55
          if (i < 8) {
            if (i % 2 === 0) a.hat(t, velocity)
          } else {
            a.hat(t, velocity)
            if (i >= 12) a.hat(t + STEP / 2, velocity * 0.8)
          }
        }
        a.riser(ROLL_AT, 16 * STEP)
      }

      setReady(false)
      setRun(next)
    }
    window.addEventListener(STAGE_EVENT, onStage)
    return () => window.removeEventListener(STAGE_EVENT, onStage)
  }, [router])

  // navigate mid-roll; allow the reveal once the roll has played
  useEffect(() => {
    if (!run) return
    // once the portal has filled the screen, the backdrop can stop drawing
    const covered = window.setTimeout(() => {
      const root = document.documentElement
      if (root.dataset.stage === 'on') root.dataset.stageCovered = ''
    }, COVERED_AT)
    const push = window.setTimeout(() => onPushTime(), PUSH_AT)
    const min = window.setTimeout(() => setReady(true), MIN_REVEAL)
    const giveUp = window.setTimeout(() => onFinish(), GIVE_UP)
    // Back / Forward mid-show: that navigation wins, the show stops
    const onPop = () => {
      window.clearTimeout(push)
      pushed.current = true
      onFinish()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.clearTimeout(covered)
      window.clearTimeout(push)
      window.clearTimeout(min)
      window.clearTimeout(giveUp)
      window.removeEventListener('popstate', onPop)
    }
  }, [run])

  const revealing = !!run && ready && pathname !== run.from

  // skip ahead (keys are ours while the stage covers the page, so Space
  // doesn't also reach the player)
  useEffect(() => {
    if (!run || revealing) return
    const onKey = (e: KeyboardEvent) => {
      if (!['Escape', 'Enter', ' '].includes(e.key)) return
      e.preventDefault()
      e.stopImmediatePropagation()
      if (!e.repeat) onSkip()
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [run, revealing])

  // the drop
  useEffect(() => {
    if (!revealing) return
    const root = document.documentElement
    delete root.dataset.stage
    delete root.dataset.stageCovered
    window.dispatchEvent(new Event(STAGE_REVEAL_EVENT))
    audio.current?.boom(0)
    audio.current?.clap(0)
    root.classList.add('stage-hit')
    const unhit = window.setTimeout(() => root.classList.remove('stage-hit'), 340)
    const done = window.setTimeout(() => onFinish(), REVEAL_MS)
    return () => {
      window.clearTimeout(unhit)
      window.clearTimeout(done)
      root.classList.remove('stage-hit')
    }
  }, [revealing])

  const stage = run ? STAGES[run.stage] : null

  return (
    <>
      {/* always mounted, so screen readers announce the text when it changes */}
      <div role='status' aria-live='polite' className='sr-only'>
        {stage ? `${stage.kicker}: ${stage.title}. Loading.` : ''}
      </div>

      {run && stage && (
        <div
          aria-hidden
          className={cn(
            'fixed inset-0 z-[9999] overflow-hidden select-none',
            // once the page is revealed, it's usable straight away
            revealing ? 'pointer-events-none' : 'cursor-progress'
          )}
          style={
            {
              '--ox': `${run.x}px`,
              '--oy': `${run.y}px`,
              '--stage-c0': stage.colors[0],
              '--stage-c1': stage.colors[1],
              '--stage-c2': stage.colors[2]
            } as React.CSSProperties
          }
          onClick={skip}
        >
          <div
            className={cn('stage-wash absolute inset-0', revealing && 'opacity-0')}
          />
          <div className='stage-portal absolute inset-0'>
            <PixelField revealing={revealing} />
            <Warp key={run.id} colors={stage.colors} revealing={revealing} />
            <div className='stage-scan pointer-events-none absolute inset-0' />
            <StageCard
              id={run.stage}
              meta={run.meta ?? stage.meta}
              revealing={revealing}
            />
          </div>
          <div
            className={cn(
              'stage-flash pointer-events-none absolute inset-0',
              revealing && 'stage-flash-on'
            )}
          />
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------------- */

const rand = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** The black of the stage, as a grid of pixels that flicks off from the middle. */
function PixelField({ revealing }: { revealing: boolean }) {
  const [grid] = useState(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    const size = w < 640 ? 56 : 80
    const cols = Math.ceil(w / size)
    const rows = Math.ceil(h / size)
    const cx = cols / 2
    const cy = rows / 2
    const far = Math.hypot(cx, cy)
    const delays = Array.from({ length: cols * rows }, (_, i) => {
      const x = (i % cols) + 0.5
      const y = Math.floor(i / cols) + 0.5
      const d = Math.hypot(x - cx, y - cy) / far
      return Math.round(d * 400 + rand(i) * 110)
    })
    return { size, cols, delays }
  })
  return (
    <div
      className='absolute inset-0 grid'
      style={{
        gridTemplateColumns: `repeat(${grid.cols}, ${grid.size}px)`,
        gridAutoRows: `${grid.size}px`
      }}
    >
      {grid.delays.map((d, i) => (
        <span
          key={i}
          className={cn('stage-pixel', revealing && 'stage-pixel-out')}
          style={{ '--d': `${d}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

/** LEDs rushing past: a starfield snapped to the site's LED grid. */
function Warp({
  colors,
  revealing
}: {
  colors: readonly string[]
  revealing: boolean
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const revealRef = useRef(revealing)

  useEffect(() => {
    revealRef.current = revealing
  }, [revealing])

  useEffect(() => {
    const cv = canvas.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    cv.width = Math.round(w * dpr)
    cv.height = Math.round(h * dpr)
    ctx.scale(dpr, dpr)

    const cell = w < 640 ? 7 : 8
    const count = w < 640 ? 170 : 340
    const cx = w / 2
    const cy = h / 2
    const spread = Math.max(w, h) * 0.55
    const palette = [...colors, '#ffffff']
    type Star = { x: number; y: number; z: number; c: string; v: number }
    const spawn = (initial: boolean): Star => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: initial ? 0.25 + Math.random() * 0.75 : 1,
      c: palette[Math.random() < 0.08 ? 3 : Math.floor(Math.random() * 3)],
      v: 0.65 + Math.random() * 0.5
    })
    const stars = Array.from({ length: count }, () => spawn(true))
    const project = (s: Star, z: number) => ({
      x: cx + (s.x / z) * spread * 0.35,
      y: cy + (s.y / z) * spread * 0.35
    })

    const start = performance.now()
    let last = start
    let revealAt = 0
    let raf = 0

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const t = (now - start) / 1000
      let speed = 0.12 + Math.pow(Math.min(1, t / 1.0), 2) * 1.5
      if (revealRef.current) {
        if (!revealAt) revealAt = now
        speed += ((now - revealAt) / 1000) * 7
      }

      // fade what's there, leaving trails of dimming LEDs
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(0,0,0,0.26)'
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'

      for (const s of stars) {
        const z0 = s.z
        s.z -= speed * dt * s.v
        if (s.z <= 0.04) {
          Object.assign(s, spawn(false))
          continue
        }
        const a = project(s, z0)
        const b = project(s, s.z)
        if (b.x < -cell || b.x > w + cell || b.y < -cell || b.y > h + cell) {
          Object.assign(s, spawn(false))
          continue
        }
        const near = 1 - s.z
        const size = Math.max(2, Math.min(cell - 2, 1.5 + near * near * 7))
        // far away = dim, so the vanishing point doesn't burn white
        ctx.globalAlpha = Math.min(1, Math.pow(near, 1.4) * 1.5)
        ctx.fillStyle = s.c
        // light every LED cell between the last position and this one
        const ax = Math.floor(a.x / cell)
        const ay = Math.floor(a.y / cell)
        const bx = Math.floor(b.x / cell)
        const by = Math.floor(b.y / cell)
        const steps = Math.min(14, Math.max(Math.abs(bx - ax), Math.abs(by - ay)))
        for (let k = 0; k <= steps; k++) {
          const f = steps ? k / steps : 1
          const gx = Math.round(ax + (bx - ax) * f)
          const gy = Math.round(ay + (by - ay) * f)
          const o = (cell - size) / 2
          ctx.fillRect(gx * cell + o, gy * cell + o, size, size)
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [colors])

  return (
    <canvas
      ref={canvas}
      className={cn(
        'absolute inset-0 h-full w-full transition-opacity duration-500',
        revealing && 'opacity-0'
      )}
    />
  )
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/'

/** Letters flicker through random glyphs, locking in left to right. */
function Scramble({
  text,
  delay,
  duration
}: {
  text: string
  delay: number
  duration: number
}) {
  const words = text.split(' ')
  const letters = words.join('')
  // what each letter shows right now ('' = not there yet)
  const [shown, setShown] = useState<string[]>(() => [...letters].map(() => ''))

  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const chars = [...letters]
    const tick = (now: number) => {
      const t = now - t0 - delay
      setShown(
        chars.map((ch, i) => {
          const lockAt = (i / chars.length) * duration
          if (t >= lockAt + 70) return ch
          if (t >= lockAt - 160) return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          return ''
        })
      )
      if (t < duration + 120) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [letters, delay, duration])

  // each letter keeps its final width, so the line never jumps around
  let index = 0
  return (
    <>
      {words.map((word, w) => (
        <span key={w} className='inline-block whitespace-nowrap'>
          {[...word].map(ch => {
            const i = index++
            return (
              <span key={i} className='relative inline-block'>
                <span className='invisible'>{ch}</span>
                <span className='absolute inset-0 text-center'>{shown[i]}</span>
              </span>
            )
          })}
          {w < words.length - 1 && '\u00a0'}
        </span>
      ))}
    </>
  )
}

// one bar of a trap pattern on 16 pads: 808s, claps on 2 and 4, hats between
const PADS = Array.from({ length: 16 }, (_, i) =>
  [0, 6, 10].includes(i) ? 'kick' : [4, 12].includes(i) ? 'clap' : 'hat'
)

function StageCard({
  id,
  meta,
  revealing
}: {
  id: StageId
  meta: string
  revealing: boolean
}) {
  const stage = STAGES[id]
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center px-6 text-center',
        revealing && 'stage-card-out'
      )}
    >
      {/* the G, spinning like a coin waiting to be collected */}
      <GIcon mode='coin' label={null} className='mb-6 size-20 sm:size-24' />
      <p
        className='stage-kicker font-pixel text-[12px] tracking-[0.42em] uppercase sm:text-[13px]'
        style={{ color: 'var(--stage-c0)' }}
      >
        {stage.kicker}
      </p>
      <p className='stage-title font-display-wide mt-5 text-[clamp(2.5rem,9.5vw,7.25rem)] leading-[0.9] text-bone uppercase'>
        <Scramble text={stage.title} delay={240} duration={520} />
      </p>
      <div className='mt-10 flex items-center gap-1.5 sm:gap-2'>
        {PADS.map((kind, i) => (
          <span
            key={i}
            data-kind={kind}
            className={cn('stage-pad', i > 0 && i % 4 === 0 && 'ml-2 sm:ml-3')}
            style={{ '--i': i } as React.CSSProperties}
          />
        ))}
      </div>
      <p className='mt-6 font-pixel text-[11px] tracking-[0.3em] text-bone-muted uppercase'>
        {meta}
        <span className='animate-blink'>_</span>
      </p>
    </div>
  )
}
