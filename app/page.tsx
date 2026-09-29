'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react'
import { SiSpotify } from 'react-icons/si'
import sentinelImage from '../public/sentinel.png'
import { Wordmark } from './components/brand/Wordmark'
import { buttonClasses } from './components/Button'
import { BeatCover } from './components/Covers'
import { EqBars, Eyebrow, SectionHeader } from './components/ui'
import { useBeatPlayback } from './components/usePlayback'
import type { BeatTrack } from './models/Track'
import { LOCAL_BEATS, beatSubtitle, pickFeatured } from '@/lib/beats'
import { navigateWithTransition } from '@/lib/transition'
import { cn } from '@/lib/utils'

const FEATURED = pickFeatured(LOCAL_BEATS)

// "Burna Boy", "Central Cee", ... for the ticker
const TYPE_BEATS = [
  ...new Set(
    LOCAL_BEATS.map(b => b.subtitle)
      .filter((s): s is string => !!s && /type beat/i.test(s))
      .map(s => s.replace(/\s*type beat\s*/i, '').trim())
  )
]

const MODES = [
  {
    href: '/studio',
    label: 'Studio',
    blurb: 'Every beat and pack. Filter by genre, tempo and mood, then press play.',
    accent: 'var(--color-signal)',
    transition: 'Loading studio'
  },
  {
    href: '/spotify',
    label: 'Spotify',
    blurb: 'Playlists from my own library. Connect Spotify to play them right here.',
    accent: 'var(--color-spotify)',
    transition: 'Loading playlists'
  },
  {
    href: '/tech',
    label: 'Tech',
    blurb: 'How it’s built: Next.js, signed S3 audio, Spotify OAuth and WebGL.',
    accent: 'var(--color-live)'
  },
  {
    href: '/about',
    label: 'About',
    blurb: 'The producer behind the pads, and what’s on repeat right now.',
    accent: '#A78BFA'
  }
] as const

// pads that light up on each mode card (3x3, row-major)
const MODE_PADS = [
  [0, 1, 2, 3, 5, 6, 7, 8],
  [0, 2, 4, 6, 8],
  [1, 3, 4, 5, 7],
  [0, 1, 2, 4, 7]
]

export default function Home() {
  const router = useRouter()

  const transitionTo =
    (href: string, label?: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!label) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return
      e.preventDefault()
      navigateWithTransition(router, href, label)
    }

  return (
    <main className='overflow-x-clip'>
      {/* ---------------------------------------------------------------- HERO */}
      <section className='relative mx-auto grid w-full max-w-[1240px] items-center gap-4 px-5 pt-[calc(var(--nav-h)+0.5rem)] sm:px-8 lg:min-h-[min(100svh,960px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10 lg:pt-(--nav-h)'>
        <div className='relative order-1 mx-auto w-full max-w-[18.5rem] sm:max-w-[26rem] lg:order-2 lg:max-w-none'>
          <HeroArt />
        </div>

        <div className='relative order-2 -mt-6 flex flex-col items-start pb-12 sm:mt-0 lg:order-1 lg:pb-0'>
          <Eyebrow>Music producer · Toronto</Eyebrow>

          <h1 className='mt-6 w-full'>
            <span className='group/wordmark block w-full max-w-[34rem]'>
              <Wordmark split glitchOnHover className='w-full' />
            </span>
            <span className='font-display-wide mt-5 block text-[clamp(3rem,7.4vw,6.4rem)] text-bone sm:mt-6'>
              Next level beats
              <span
                aria-hidden
                className='ml-[0.06em] inline-block size-[0.17em] translate-y-[-0.02em] rounded-[0.03em] bg-signal shadow-[0_0_0.3em_var(--color-signal)]'
              />
              <span className='sr-only'>.</span>
            </span>
          </h1>

          <p className='mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[12px] tracking-[0.16em] text-bone-muted uppercase sm:text-[13px] sm:tracking-[0.18em]'>
            {['Trap', 'Drill', 'Afrobeats', 'Experimental'].map((genre, i, all) => (
              <span key={genre} className='flex items-center gap-3'>
                {genre}
                {i < all.length - 1 && (
                  <span aria-hidden className='text-bone-dim'>
                    /
                  </span>
                )}
              </span>
            ))}
          </p>

          <p className='mt-4 max-w-[34rem] text-lg leading-relaxed text-pretty text-bone-muted sm:text-xl'>
            Original beats and curated Spotify playlists, streamed right in your
            browser.
          </p>

          <div className='mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap'>
            <Link
              href='/studio'
              onClick={transitionTo('/studio', 'Loading studio')}
              className={buttonClasses({ size: 'lg', className: 'group/cta' })}
            >
              Enter the studio
              <ArrowRight className='size-4 transition-transform duration-200 ease-snap group-hover/cta:translate-x-0.5' />
            </Link>
            <Link
              href='/spotify'
              onClick={transitionTo('/spotify', 'Loading playlists')}
              className={buttonClasses({ size: 'lg', variant: 'secondary' })}
            >
              <SiSpotify className='size-4 text-spotify' />
              Discover my Spotify
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- TICKER */}
      <Ticker items={TYPE_BEATS} />

      {/* ---------------------------------------------------------- QUICK PLAY */}
      <section
        aria-labelledby='quick-play'
        className='mx-auto mt-20 w-full max-w-[1240px] px-5 sm:mt-28 sm:px-8'
      >
        <SectionHeader
          id='quick-play'
          eyebrow='Quick play'
          title='Start with a featured beat'
          action={
            <Link
              href='/studio'
              onClick={transitionTo('/studio', 'Loading studio')}
              className='group/all hud-label inline-flex items-center gap-2 rounded-md py-1 transition-colors hover:text-bone'
            >
              All {LOCAL_BEATS.length} beats
              <ArrowRight className='size-3.5 transition-transform duration-200 group-hover/all:translate-x-0.5' />
            </Link>
          }
        />
        <QuickPlay beats={FEATURED} />
      </section>

      {/* --------------------------------------------------------- MODE SELECT */}
      <section
        aria-labelledby='modes'
        className='mx-auto mt-20 w-full max-w-[1240px] px-5 sm:mt-28 sm:px-8'
      >
        <SectionHeader id='modes' eyebrow='Select mode' title='Where to next?' />
        <ul className='grid gap-3 sm:grid-cols-2 sm:gap-4'>
          {MODES.map((mode, i) => (
            <li key={mode.href}>
              <Link
                href={mode.href}
                onClick={transitionTo(
                  mode.href,
                  'transition' in mode ? mode.transition : undefined
                )}
                className='group surface relative isolate flex h-full min-h-[190px] flex-col justify-between gap-8 overflow-hidden rounded-3xl p-6 transition-[border-color,transform] duration-300 ease-snap hover:-translate-y-0.5 hover:border-white/15 sm:min-h-[240px] sm:p-8'
              >
                <span
                  aria-hidden
                  className='pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100'
                  style={{
                    background: `radial-gradient(70% 90% at 100% 0%, color-mix(in srgb, ${mode.accent} 14%, transparent), transparent 70%)`
                  }}
                />
                <span className='flex items-start justify-between gap-6'>
                  <span className='tabular font-mono text-xs tracking-[0.2em] text-bone-dim'>
                    0{i + 1}
                  </span>
                  <ModePads lit={MODE_PADS[i]} color={mode.accent} />
                </span>
                <span className='flex items-end justify-between gap-6'>
                  <span className='flex flex-col gap-3'>
                    <span className='font-display-wide text-[2.4rem] text-bone uppercase sm:text-[3.1rem]'>
                      {mode.label}
                    </span>
                    <span className='max-w-sm text-[15px] leading-relaxed text-bone-muted'>
                      {mode.blurb}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className='flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-bone transition-[background-color,border-color,color] duration-300 group-hover:border-transparent group-hover:bg-bone group-hover:text-ink-950'
                  >
                    <ArrowUpRight className='size-[18px] transition-transform duration-300 ease-snap group-hover:rotate-45' />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

/* ------------------------------------------------------------------------- */

function HeroArt() {
  return (
    <div className='relative aspect-square w-full'>
      {/* HUD corner brackets */}
      {[
        'top-0 left-0 border-t border-l rounded-tl-lg',
        'top-0 right-0 border-t border-r rounded-tr-lg',
        'bottom-0 left-0 border-b border-l rounded-bl-lg',
        'right-0 bottom-0 border-r border-b rounded-br-lg'
      ].map(pos => (
        <span
          key={pos}
          aria-hidden
          className={cn('absolute hidden size-8 border-white/20 sm:block', pos)}
        />
      ))}
      <div className='absolute inset-[4%] [mask-image:radial-gradient(closest-side,black_68%,transparent)]'>
        <Image
          src={sentinelImage}
          alt='The GameOver Sentinel: a horned, armoured figure breaking into red and cyan pixels'
          fill
          priority
          placeholder='blur'
          sizes='(min-width: 1024px) 560px, (min-width: 640px) 480px, 90vw'
          className='object-cover'
        />
      </div>
      <span className='hud-label absolute bottom-3 left-1/2 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap sm:flex'>
        <span aria-hidden className='size-1.5 rounded-[2px] bg-live shadow-[0_0_8px_var(--color-live)]' />
        P1 · Sentinel
      </span>
    </div>
  )
}

function Ticker({ items }: { items: string[] }) {
  if (!items.length) return null
  const run = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className='flex shrink-0 items-center gap-8 pr-8 sm:gap-10 sm:pr-10'
    >
      {items.map(name => (
        <li key={name} className='flex items-center gap-8 sm:gap-10'>
          <span className='font-pixel text-[13px] tracking-[0.12em] whitespace-nowrap text-bone-muted uppercase sm:text-sm'>
            {name} <span className='text-bone-dim'>type beat</span>
          </span>
          <span
            aria-hidden
            className='size-1.5 rounded-[2px] bg-signal/80 shadow-[0_0_8px_var(--color-signal)]'
          />
        </li>
      ))}
    </ul>
  )
  return (
    <section
      aria-label='Type beats in the catalogue'
      className='relative border-y border-line bg-ink-950/60 py-4 backdrop-blur-sm [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]'
    >
      <div className='flex w-max animate-marquee hover:[animation-play-state:paused]'>
        {run(false)}
        {run(true)}
      </div>
    </section>
  )
}

function QuickPlay({ beats }: { beats: BeatTrack[] }) {
  const { toggle, stateOf } = useBeatPlayback()
  return (
    <ul className='-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden'>
      {beats.map(beat => {
        const { current, playing } = stateOf(beat.id)
        return (
          <li
            key={beat.id}
            className={cn(
              'group surface relative isolate flex w-[46%] shrink-0 snap-start flex-col gap-3 rounded-2xl p-2.5 transition-[border-color,transform] duration-300 ease-snap has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-live hover:-translate-y-0.5 hover:border-white/15 sm:w-auto',
              current && 'border-live/30'
            )}
          >
            <div className='relative'>
              <BeatCover
                beat={beat}
                detail
                glow={current}
                className='w-full rounded-xl'
              />
              {/* visual only: the title button below covers the whole tile */}
              <span
                aria-hidden
                className={cn(
                  'absolute right-2 bottom-2 flex size-10 items-center justify-center rounded-full shadow-[0_8px_24px_-6px_rgb(0_0_0/0.8)] transition-[transform,background-color] duration-200 ease-snap group-hover:scale-105',
                  current
                    ? 'bg-signal text-ink-950'
                    : 'bg-bone text-ink-950 group-hover:bg-white'
                )}
              >
                {playing ? (
                  <Pause className='size-4' fill='currentColor' strokeWidth={0} />
                ) : (
                  <Play
                    className='size-4 translate-x-[1px]'
                    fill='currentColor'
                    strokeWidth={0}
                  />
                )}
              </span>
            </div>
            <div className='min-w-0 px-1 pb-1'>
              <button
                type='button'
                onClick={() => toggle(beat, beats)}
                aria-label={`${playing ? 'Pause' : 'Play'} ${beat.title}`}
                className={cn(
                  'flex w-full min-w-0 items-center gap-2 text-left text-[15px] font-semibold after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none',
                  current ? 'text-live' : 'text-bone'
                )}
              >
                <span className='truncate'>{beat.title}</span>
                {playing && <EqBars className='shrink-0' />}
              </button>
              <p className='mt-0.5 truncate text-[13px] text-bone-dim'>
                {beatSubtitle(beat) ?? beat.genre}
              </p>
              <p className='tabular mt-2 font-mono text-[10.5px] tracking-[0.12em] text-bone-dim uppercase'>
                {beat.bpm} BPM · {beat.genre}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ModePads({ lit, color }: { lit: readonly number[]; color: string }) {
  return (
    <span aria-hidden className='grid grid-cols-3 gap-1'>
      {Array.from({ length: 9 }, (_, i) => {
        const on = lit.includes(i)
        return (
          <span
            key={i}
            className={cn(
              'size-2.5 rounded-[3px] transition-[background-color,box-shadow,opacity] duration-300',
              on ? 'opacity-40 group-hover:opacity-100' : 'bg-white/[0.06]'
            )}
            style={
              on
                ? {
                    backgroundColor: color,
                    boxShadow: `0 0 10px color-mix(in srgb, ${color} 60%, transparent)`,
                    transitionDelay: `${i * 30}ms`
                  }
                : undefined
            }
          />
        )
      })}
    </span>
  )
}
