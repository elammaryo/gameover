'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ArrowUpRight, AudioLines, Code2 } from 'lucide-react'
import { SiGithub, SiLinkedin } from 'react-icons/si'
import profileImage from '../../public/profile.png'
import { getSpotifyTopArtists, getSpotifyTopTracks } from '../api'
import type { SpotifyTrack } from '../models/Track'
import {
  CtaBand,
  EmptyState,
  Eyebrow,
  Page,
  SectionHeader,
  Skeleton,
  Tag
} from '../components/ui'
import { SOCIAL_LINKS } from '@/lib/site'
import { cn } from '@/lib/utils'

type Artist = { name: string; images: { url: string }[] }
type Load = 'loading' | 'ready' | 'error'

const HI_SCORES = [
  { stat: 'Minutes listened', score: '56K+', color: 'var(--color-theme-2)' },
  { stat: 'Saved tracks', score: '450+', color: 'var(--color-live)' },
  { stat: 'Unique artists', score: '120+', color: 'var(--color-warn)' },
  { stat: 'Playlists made', score: '95+', color: 'var(--color-theme)' }
]

const RANKS = ['1st', '2nd', '3rd', '4th']

const CHAPTERS = [
  {
    title: 'How it started',
    body: 'My journey into music production began 4 years ago when I first discovered FL Studio. What started as a hobby quickly became a passion. I spent countless hours learning sound design, sampling, and arrangement techniques.'
  },
  {
    title: 'My sound',
    body: 'I specialize in creating hard-hitting trap and drill beats with heavy 808s, crisp hi-hats, and atmospheric melodies. I also love experimenting with afrobeats rhythms and blending genres to create unique sonic landscapes.'
  },
  {
    title: 'Beyond music',
    body: 'As a developer, I built this website from scratch using Next.js, AWS, and custom WebGL shaders. I love combining my technical skills with my creative passion to build unique digital experiences.'
  }
]

const ROLES = [
  {
    title: 'Music producer',
    icon: AudioLines,
    accent: 'var(--color-theme)',
    body: 'Specializing in trap, drill, and afrobeats. I craft hard-hitting beats with heavy 808s, crisp hi-hats, and atmospheric melodies that push boundaries.',
    points: ['100+ beats created', '4+ years experience', '8 genres explored']
  },
  {
    title: 'Software engineer',
    icon: Code2,
    accent: 'var(--color-live)',
    body: 'Full-stack developer and technical co-founder with production experience shipping features users depend on. From mobile apps to web platforms, I build scalable systems end-to-end.',
    points: [
      'Flutter, React, Next.js & Node.js',
      'Firebase, AWS & CI/CD pipelines',
      'Founding engineer at SuperOver'
    ]
  }
]

const CONNECT = [
  ...SOCIAL_LINKS,
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/omerelammary',
    handle: '@omerelammary',
    icon: SiLinkedin
  },
  {
    name: 'GitHub',
    href: 'https://github.com/elammaryo',
    handle: '@elammaryo',
    icon: SiGithub
  }
]

export default function AboutPage() {
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([])
  const [topArtists, setTopArtists] = useState<Artist[]>([])
  const [tracksState, setTracksState] = useState<Load>('loading')
  const [artistsState, setArtistsState] = useState<Load>('loading')

  useEffect(() => {
    getSpotifyTopTracks()
      .then(tracks => {
        setTopTracks(tracks)
        setTracksState('ready')
      })
      .catch(err => {
        console.error(err)
        setTracksState('error')
      })
    getSpotifyTopArtists()
      .then(artists => {
        setTopArtists(artists)
        setArtistsState('ready')
      })
      .catch(err => {
        console.error(err)
        setArtistsState('error')
      })
  }, [])

  const statsOffline =
    tracksState !== 'loading' &&
    artistsState !== 'loading' &&
    !topTracks.length &&
    !topArtists.length

  return (
    <Page>
      {/* PROFILE */}
      <header className='grid gap-10 md:grid-cols-[minmax(0,19rem)_1fr] md:items-center md:gap-14 lg:grid-cols-[minmax(0,22rem)_1fr]'>
        <figure className='relative mx-auto w-full max-w-[19rem] md:max-w-none'>
          <div className='relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-white/10 shadow-[0_40px_90px_-40px_rgb(0_0_0/0.9)]'>
            <Image
              src={profileImage}
              alt='Omer Elammary, the producer behind GameOver'
              fill
              priority
              placeholder='blur'
              sizes='(min-width: 1024px) 352px, (min-width: 768px) 304px, 80vw'
              className='object-cover object-[50%_40%]'
            />
            <div
              aria-hidden
              className='absolute inset-0 bg-[linear-gradient(to_top,rgb(7_6_10/0.85),transparent_45%)]'
            />
            <div
              aria-hidden
              className='absolute inset-0 opacity-[0.12] [background:repeating-linear-gradient(to_bottom,rgb(0_0_0)_0_1px,transparent_1px_3px)]'
            />
            <span className='absolute top-3 left-3 rounded-md bg-ink-950/75 px-2 py-1 font-pixel text-[11px] text-bone backdrop-blur-sm'>
              P1
            </span>
            <figcaption className='absolute inset-x-4 bottom-4 flex items-center justify-between gap-3'>
              <span className='hud-label text-bone-muted'>Producer × Dev</span>
              <span className='flex items-center gap-1.5'>
                <span
                  aria-hidden
                  className='size-1.5 animate-blink rounded-[2px] bg-live shadow-[0_0_8px_var(--color-live)]'
                />
                <span className='hud-label text-bone-muted'>Toronto</span>
              </span>
            </figcaption>
          </div>
        </figure>

        <div className='flex flex-col gap-6'>
          <Eyebrow>Music producer</Eyebrow>
          <h1 className='font-display-wide text-[clamp(2.9rem,7.2vw,5.75rem)] text-balance text-bone'>
            Omer Elammary
          </h1>
          <p className='max-w-2xl text-lg leading-relaxed text-pretty text-bone-muted sm:text-xl'>
            Crafting hard-hitting trap, drill, and afrobeats that push
            boundaries. Based in Toronto, blending heavy 808s with experimental
            sound design.
          </p>
          <ul className='flex flex-wrap gap-2'>
            {['4+ years', '100+ beats', '8 genres'].map((fact, i) => (
              <li key={fact}>
                <Tag
                  dot={['var(--color-theme)', 'var(--color-theme-2)', 'var(--color-live)'][i]}
                  className='h-8 px-3 text-[11px]'
                >
                  {fact}
                </Tag>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* HI-SCORES */}
      <section aria-labelledby='hi-scores' className='mt-20 sm:mt-28'>
        <SectionHeader id='hi-scores' eyebrow='Listening stats' title='Hi-scores' />
        <div className='surface relative overflow-hidden rounded-3xl px-5 py-6 sm:px-10 sm:py-9'>
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(to_bottom,rgb(255_255_255)_0_1px,transparent_1px_4px)]'
          />
          <table className='relative w-full font-pixel'>
            <caption className='sr-only'>My Spotify listening stats</caption>
            <thead>
              <tr className='text-left text-[11px] tracking-[0.2em] text-bone-dim uppercase'>
                <th scope='col' className='w-16 pb-4 font-normal sm:w-24'>
                  Rank
                </th>
                <th scope='col' className='pb-4 font-normal'>
                  Stat
                </th>
                <th scope='col' className='pb-4 text-right font-normal'>
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {HI_SCORES.map((row, i) => (
                <tr
                  key={row.stat}
                  className='border-t border-dashed border-white/10'
                  style={{ color: row.color }}
                >
                  <td className='py-3.5 text-sm sm:py-4 sm:text-base'>{RANKS[i]}</td>
                  <td className='py-3.5 text-sm text-bone uppercase sm:py-4 sm:text-lg'>
                    {row.stat}
                  </td>
                  <td
                    className='py-3.5 text-right text-xl tabular-nums sm:py-4 sm:text-3xl'
                    style={{ textShadow: `0 0 18px ${row.color}` }}
                  >
                    {row.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* LIVE SPOTIFY STATS */}
      {statsOffline ? (
        <section aria-label='Spotify stats' className='mt-20 sm:mt-28'>
          <EmptyState title='Live Spotify stats are offline'>
            The top artists and tracks feed is taking a break. Check back soon.
          </EmptyState>
        </section>
      ) : (
        <>
          <section aria-labelledby='top-artists' className='mt-20 sm:mt-28'>
            <SectionHeader
              id='top-artists'
              eyebrow='On Spotify'
              title='Top artists'
            />
            <ol className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5'>
              {artistsState === 'loading'
                ? Array.from({ length: 5 }, (_, i) => (
                    <li
                      key={i}
                      className={cn(i === 0 && 'col-span-2 sm:col-span-1')}
                    >
                      <Skeleton className='aspect-square rounded-2xl' />
                    </li>
                  ))
                : topArtists.slice(0, 5).map((artist, i) => (
                    <li
                      key={artist.name}
                      className={cn(
                        'group relative overflow-hidden rounded-2xl bg-ink-800 ring-1 ring-white/8 ring-inset',
                        i === 0 && 'col-span-2 sm:col-span-1'
                      )}
                    >
                      <div
                        className={cn(
                          'relative w-full',
                          i === 0 ? 'aspect-[2/1] sm:aspect-square' : 'aspect-square'
                        )}
                      >
                        {artist.images?.[0]?.url && (
                          <Image
                            src={artist.images[0].url}
                            alt=''
                            fill
                            sizes='(min-width: 1024px) 230px, (min-width: 640px) 30vw, 90vw'
                            className='object-cover transition-transform duration-700 ease-snap group-hover:scale-[1.04]'
                          />
                        )}
                        <div
                          aria-hidden
                          className='absolute inset-0 bg-[linear-gradient(to_top,rgb(7_6_10/0.92),rgb(7_6_10/0.2)_55%,transparent)]'
                        />
                      </div>
                      <span className='absolute top-3 left-3 rounded-md bg-ink-950/75 px-2 py-1 font-pixel text-[11px] text-bone backdrop-blur-sm'>
                        #{i + 1}
                      </span>
                      <span className='absolute inset-x-3 bottom-3 truncate text-[15px] font-semibold text-bone'>
                        {artist.name}
                      </span>
                    </li>
                  ))}
            </ol>
          </section>

          <section aria-labelledby='on-repeat' className='mt-20 sm:mt-24'>
            <SectionHeader id='on-repeat' eyebrow='Past month' title='On repeat' />
            <ol className='surface divide-y divide-line overflow-hidden rounded-3xl'>
              {tracksState === 'loading'
                ? Array.from({ length: 5 }, (_, i) => (
                    <li key={i} className='flex items-center gap-4 p-3 sm:p-4'>
                      <Skeleton className='size-14 shrink-0' />
                      <div className='flex flex-1 flex-col gap-2'>
                        <Skeleton className='h-3.5 w-1/3' />
                        <Skeleton className='h-3 w-1/4' />
                      </div>
                    </li>
                  ))
                : topTracks.slice(0, 5).map((track, i) => (
                    <li
                      key={`${track.id ?? track.name}-${i}`}
                      className='flex items-center gap-4 p-3 transition-colors hover:bg-white/[0.02] sm:gap-5 sm:p-4'
                    >
                      <span className='w-7 shrink-0 text-center font-pixel text-sm text-bone-dim sm:w-9 sm:text-base'>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className='relative size-12 shrink-0 overflow-hidden rounded-lg bg-ink-800 ring-1 ring-white/8 ring-inset sm:size-14'>
                        {(track.images?.[0]?.url ?? track.artworkUrl) && (
                          <Image
                            src={track.images?.[0]?.url ?? track.artworkUrl ?? ''}
                            alt=''
                            fill
                            sizes='56px'
                            className='object-cover'
                          />
                        )}
                      </span>
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-[15px] font-semibold text-bone sm:text-base'>
                          {track.name}
                        </span>
                        <span className='block truncate text-[13px] text-bone-dim sm:text-sm'>
                          {track.artists?.map(a => a.name).join(', ')}
                        </span>
                      </span>
                      <span className='hidden max-w-[16rem] truncate text-sm text-bone-muted md:block'>
                        {track.album?.name}
                      </span>
                    </li>
                  ))}
            </ol>
          </section>
        </>
      )}

      {/* STORY */}
      <section aria-labelledby='story' className='mt-20 sm:mt-28'>
        <SectionHeader id='story' eyebrow='The story so far' title='My journey' />
        <ol className='grid gap-3 sm:gap-4 md:grid-cols-3'>
          {CHAPTERS.map((chapter, i) => (
            <li key={chapter.title} className='surface flex flex-col gap-4 rounded-3xl p-6 sm:p-7'>
              <span className='flex items-center justify-between'>
                <span className='tabular font-mono text-xs tracking-[0.2em] text-bone-dim uppercase'>
                  Track 0{i + 1}
                </span>
                <span aria-hidden className='flex gap-1'>
                  {Array.from({ length: 3 }, (_, k) => (
                    <span
                      key={k}
                      className={cn(
                        'size-2 rounded-[2px]',
                        k <= i ? 'bg-theme/80' : 'bg-white/10'
                      )}
                    />
                  ))}
                </span>
              </span>
              <h3 className='font-display-tight text-xl text-bone sm:text-2xl'>
                {chapter.title}
              </h3>
              <p className='text-[15px] leading-relaxed text-bone-muted'>
                {chapter.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* PRODUCER x DEVELOPER */}
      <section aria-labelledby='two-sides' className='mt-20 sm:mt-28'>
        <SectionHeader id='two-sides' eyebrow='Two sides' title='Producer × developer' />
        <div className='grid gap-3 sm:gap-4 md:grid-cols-2'>
          {ROLES.map(role => {
            const Icon = role.icon
            return (
              <article
                key={role.title}
                className='surface relative isolate overflow-hidden rounded-3xl p-6 sm:p-8'
                style={{
                  backgroundImage: `radial-gradient(70% 90% at 100% 0%, color-mix(in srgb, ${role.accent} 12%, transparent), transparent 70%)`
                }}
              >
                <span
                  className='mb-6 flex size-12 items-center justify-center rounded-xl'
                  style={{
                    color: role.accent,
                    backgroundColor: `color-mix(in srgb, ${role.accent} 12%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${role.accent} 30%, transparent)`
                  }}
                >
                  <Icon className='size-[22px]' />
                </span>
                <h3 className='font-display-tight text-2xl text-bone'>{role.title}</h3>
                <p className='mt-3 max-w-md text-[15px] leading-relaxed text-bone-muted'>
                  {role.body}
                </p>
                <ul className='mt-6 flex flex-col gap-2.5'>
                  {role.points.map(point => (
                    <li key={point} className='flex items-center gap-3 text-sm text-bone-muted'>
                      <span
                        aria-hidden
                        className='size-1.5 shrink-0 rounded-[2px]'
                        style={{ backgroundColor: role.accent }}
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>

      {/* CONNECT */}
      <section aria-labelledby='connect' className='mt-20 sm:mt-28'>
        <SectionHeader id='connect' eyebrow='Say hi' title='Connect with me' />
        <ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {CONNECT.map(({ name, href, handle, icon: Icon }) => (
            <li key={name}>
              <a
                href={href}
                target='_blank'
                rel='noopener noreferrer'
                className='group surface flex items-center gap-4 rounded-2xl p-4 transition-[border-color,translate,scale] duration-300 ease-snap hover:-translate-y-0.5 hover:border-white/15 sm:p-5'
              >
                <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-bone-muted transition-colors group-hover:text-bone'>
                  <Icon className='size-5' />
                </span>
                <span className='flex min-w-0 flex-col'>
                  <span className='font-semibold text-bone'>{name}</span>
                  <span className='truncate font-mono text-xs text-bone-dim'>{handle}</span>
                </span>
                <ArrowUpRight className='ml-auto size-4 text-bone-dim transition-[color,translate,scale] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-bone' />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand
        className='mt-24 sm:mt-32'
        icon={<Code2 />}
        accent='var(--color-live)'
        title='Curious about the tech?'
        href='/tech'
        cta='View the stack'
      >
        Explore the full-stack architecture powering this site. Built with
        Next.js, AWS S3, serverless functions, and custom WebGL shaders.
      </CtaBand>
    </Page>
  )
}
