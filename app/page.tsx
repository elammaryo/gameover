'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore
} from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { SiSpotify } from 'react-icons/si'
import sentinelImage from '../public/sentinel.png'
import { Wordmark } from './components/brand/Wordmark'
import { useBeatPulse } from './components/useBeatPulse'
import { LOCAL_BEATS } from '@/lib/beats'
import { readSfx, setSfxEnabled, subscribeSfx } from '@/lib/sfx'
import { enterStage, type StageId } from '@/lib/stage'
import { cn } from '@/lib/utils'

const BEAT_COUNT = LOCAL_BEATS.length
const YEAR = new Date().getFullYear()
const HI_BPM = Math.max(0, ...LOCAL_BEATS.map(b => b.bpm || 0))

// "Burna Boy", "Central Cee", ... for the ticker
const TYPE_BEATS = [
  ...new Set(
    LOCAL_BEATS.map(b => b.subtitle)
      .filter((s): s is string => !!s && /type beat/i.test(s))
      .map(s => s.replace(/\s*type beat\s*/i, '').trim())
  )
]

const GENRES = [
  { label: 'Trap', color: 'var(--color-theme)' },
  { label: 'Drill', color: 'var(--color-theme-2)' },
  { label: 'Hip-hop', color: 'var(--color-theme-3)' }
]

/**
 * The title screen: one way in. Everything funnels to START, which plays
 * the stage transition into the studio.
 */
export default function Home() {
  const router = useRouter()
  const startRef = useRef<HTMLAnchorElement>(null)

  // (the screen zooms away while a stage transition runs: .title-screen in
  // globals.css keys off <html data-stage>, so it can never get stuck)
  const enter = (stage: StageId, from: Element | null) => {
    enterStage(
      router,
      stage === 'studio' ? '/studio' : '/spotify',
      stage,
      from,
      stage === 'studio' ? `Loading ${BEAT_COUNT} beats` : undefined
    )
  }

  const onClick =
    (stage: StageId) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return
      e.preventDefault()
      enter(stage, e.currentTarget)
    }

  // Enter anywhere on the title screen is "press start"
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key !== 'Enter' || e.repeat || e.metaKey || e.ctrlKey || e.altKey)
      return
    const target = e.target as HTMLElement | null
    if (target?.closest('a, button, input, textarea, select, [contenteditable]'))
      return
    e.preventDefault()
    enter('studio', startRef.current)
  })
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  return (
    <main className='title-screen relative flex min-h-[100svh] flex-col overflow-x-clip'>
      <span
        aria-hidden
        className='title-sweep pointer-events-none absolute inset-x-0 top-0 z-0 h-[28vh]'
      />

      {/* HUD, top */}
      <div className='intro-fade pointer-events-none absolute inset-x-0 top-[calc(var(--nav-h)+0.5rem)] z-10 mx-auto flex w-full max-w-[1440px] justify-between px-5 font-pixel text-[10px] tracking-[0.22em] uppercase sm:px-8 sm:text-[11px]'>
        <p>
          <span className='text-bone-dim'>Beats </span>
          <span className='tabular text-theme'>
            {String(BEAT_COUNT).padStart(3, '0')}
          </span>
        </p>
        <p>
          <span className='text-bone-dim'>Hi-BPM </span>
          <span className='tabular text-theme-2'>{HI_BPM}</span>
        </p>
      </div>

      <section className='relative flex flex-1 flex-col items-center justify-center px-5 pt-(--nav-h) pb-4 [--sentinel:clamp(170px,calc(100svh_-_430px),420px)] sm:pb-8 sm:[--sentinel:clamp(170px,calc(100svh_-_500px),580px)]'>
        <Sentinel />

        <h1 className='relative z-10 -mt-[calc(var(--sentinel)*0.26)] flex w-full flex-col items-center'>
          <Wordmark
            label='GameOver'
            className='intro-rise w-[min(86vw,840px,104svh)]'
          />
          <span
            className='intro-rise font-display-wide mt-[clamp(1rem,2.6vw,1.9rem)] text-[clamp(1.05rem,3vw,2.1rem)] tracking-[0.02em] text-bone uppercase'
            style={{ '--intro-at': '380ms' } as React.CSSProperties}
          >
            Next level beats
          </span>
        </h1>

        <p
          className='intro-rise relative z-10 mt-4 flex items-center gap-3 font-pixel text-[11px] tracking-[0.3em] text-bone-muted uppercase sm:mt-5 sm:gap-4 sm:text-[12px]'
          style={{ '--intro-at': '780ms' } as React.CSSProperties}
        >
          {GENRES.map((genre, i) => (
            <span key={genre.label} className='flex items-center gap-3 sm:gap-4'>
              {i > 0 && (
                <span
                  aria-hidden
                  className='size-[5px] rounded-[1px]'
                  style={{
                    backgroundColor: genre.color,
                    boxShadow: `0 0 8px ${genre.color}`
                  }}
                />
              )}
              {genre.label}
            </span>
          ))}
        </p>

        <div
          className='intro-rise relative z-10 mt-8 flex flex-col items-center sm:mt-10'
          style={{ '--intro-at': '920ms' } as React.CSSProperties}
        >
          <p
            aria-hidden
            className='mb-3.5 animate-blink font-pixel text-[11px] tracking-[0.4em] text-theme uppercase'
          >
            Press start
          </p>
          <StartButton ref={startRef} onClick={onClick('studio')} />
          <Link
            href='/spotify'
            onClick={onClick('spotify')}
            className='group/spot mt-5 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-bone-muted transition-colors hover:text-bone'
          >
            <SiSpotify className='size-4 text-spotify' aria-hidden />
            <span>
              or{' '}
              <span className='underline decoration-line-strong underline-offset-4 transition-colors group-hover/spot:decoration-spotify'>
                discover my Spotify
              </span>
            </span>
          </Link>
        </div>
      </section>

      {/* HUD, bottom */}
      <div className='intro-fade relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 pb-3 font-pixel text-[10px] tracking-[0.22em] text-bone-dim uppercase sm:px-8 sm:text-[11px]'>
        {/* prerendered at build time; don't fight the client over the year */}
        <p suppressHydrationWarning>© {YEAR} GameOver</p>
        <SfxToggle />
      </div>

      <Ticker items={TYPE_BEATS} />
    </main>
  )
}

/* ------------------------------------------------------------------------- */

function StartButton({
  ref,
  onClick
}: {
  ref: React.Ref<HTMLAnchorElement>
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void
}) {
  const glow = useRef<HTMLSpanElement>(null)
  useBeatPulse(glow)
  return (
    <Link
      ref={ref}
      href='/studio'
      onClick={onClick}
      className='group/start relative isolate inline-flex h-16 items-center gap-4 rounded-full bg-theme pr-7 pl-2.5 text-[17px] font-semibold text-ink-950 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3),inset_0_-3px_0_rgb(0_0_0/0.18)] transition-[scale,background-color] duration-300 ease-snap hover:scale-[1.04] hover:bg-theme-hi active:scale-[0.97] sm:h-[68px] sm:pr-8 sm:text-lg'
    >
      {/* glow: breathes on its own, pumps with the kick when a beat plays */}
      <span
        ref={glow}
        aria-hidden
        className='start-glow absolute -inset-1 -z-10 rounded-full'
        style={{ '--kick': 0 } as React.CSSProperties}
      />
      <span className='flex size-11 items-center justify-center rounded-full bg-ink-950 text-theme transition-transform duration-300 ease-snap group-hover/start:rotate-[-8deg] sm:size-12'>
        <Play className='size-[18px] translate-x-[1.5px]' fill='currentColor' strokeWidth={0} />
      </span>
      Enter the studio
      <kbd
        aria-hidden
        className='ml-1 hidden h-7 items-center rounded-md border border-ink-950/25 px-2 font-mono text-[11px] font-medium text-ink-950/70 sm:inline-flex'
      >
        Enter ⏎
      </kbd>
      {/* sheen */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'
      >
        <span className='absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-[start-sheen_3.6s_ease-in-out_1.6s_infinite] motion-reduce:hidden' />
      </span>
    </Link>
  )
}

function Sentinel() {
  const ref = useRef<HTMLDivElement>(null)
  useBeatPulse(ref)

  // a little parallax against the pointer
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return
    let raf = 0
    let x = 0
    let y = 0
    let tx = 0
    let ty = 0
    const tick = () => {
      x += (tx - x) * 0.07
      y += (ty - y) * 0.07
      el.style.setProperty('--px', x.toFixed(4))
      el.style.setProperty('--py', y.toFixed(4))
      raf =
        Math.abs(tx - x) + Math.abs(ty - y) > 0.0005 ? requestAnimationFrame(tick) : 0
    }
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5
      ty = e.clientY / window.innerHeight - 0.5
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className='intro-fade pointer-events-none relative aspect-square h-(--sentinel) shrink-0'
      style={
        { '--kick': 0, '--px': 0, '--py': 0, '--intro-at': '120ms' } as React.CSSProperties
      }
    >
      <div className='sentinel-float absolute inset-0'>
        <div className='absolute inset-0 translate-x-[calc(var(--px)*-22px)] translate-y-[calc(var(--py)*-14px)] scale-[calc(1+var(--kick)*0.02)] [mask-composite:intersect] [mask-image:radial-gradient(closest-side,black_58%,transparent),linear-gradient(to_bottom,black_46%,transparent_71%)]'>
          <Image
            src={sentinelImage}
            alt=''
            fill
            priority
            placeholder='blur'
            sizes='(min-width: 640px) 580px, 90vw'
            className='object-cover'
          />
        </div>
      </div>
    </div>
  )
}

function SfxToggle() {
  const on = useSyncExternalStore(subscribeSfx, readSfx, () => true)
  return (
    <button
      type='button'
      onClick={() => setSfxEnabled(!on)}
      aria-pressed={on}
      className='-mr-2 inline-flex items-center gap-2 rounded-md px-2 py-1.5 tracking-[0.22em] uppercase transition-colors hover:text-bone'
    >
      {on ? (
        <Volume2 aria-hidden className='size-3.5' />
      ) : (
        <VolumeX aria-hidden className='size-3.5' />
      )}
      <span>
        SFX <span className={on ? 'text-theme' : undefined}>{on ? 'On' : 'Off'}</span>
      </span>
    </button>
  )
}

function Ticker({ items }: { items: string[] }) {
  const [paused, setPaused] = useState(false)
  if (!items.length) return null
  const run = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className='flex shrink-0 items-center gap-8 pr-8 sm:gap-10 sm:pr-10'
    >
      {items.map(name => (
        <li key={name} className='flex items-center gap-8 sm:gap-10'>
          <span className='font-pixel text-[12px] tracking-[0.12em] whitespace-nowrap text-bone-muted uppercase sm:text-[13px]'>
            {name} <span className='text-bone-dim'>type beat</span>
          </span>
          <span
            aria-hidden
            className='size-1.5 rounded-[2px] bg-theme/80 shadow-[0_0_8px_var(--color-theme)]'
          />
        </li>
      ))}
    </ul>
  )
  return (
    <section
      aria-label='Type beats in the catalogue'
      className='relative z-10 border-t border-line bg-ink-950/70 backdrop-blur-sm'
    >
      <div className='overflow-hidden py-3.5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_88%,transparent)]'>
        <div
          className={cn(
            'flex w-max animate-marquee hover:[animation-play-state:paused]',
            paused && '[animation-play-state:paused]'
          )}
        >
          {run(false)}
          {run(true)}
        </div>
      </div>
      <button
        type='button'
        onClick={() => setPaused(p => !p)}
        aria-pressed={paused}
        aria-label={paused ? 'Play the ticker' : 'Pause the ticker'}
        className='absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg border border-line bg-ink-900/90 text-bone-dim transition-colors hover:border-line-strong hover:text-bone motion-reduce:hidden sm:right-5'
      >
        {paused ? (
          <Play className='size-3.5' fill='currentColor' strokeWidth={0} />
        ) : (
          <Pause className='size-3.5' fill='currentColor' strokeWidth={0} />
        )}
      </button>
    </section>
  )
}
