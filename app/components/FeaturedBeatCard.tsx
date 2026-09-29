'use client'

import { useContext } from 'react'
import { BeatTrack, Track } from '../models/Track'
import { PlayBarContext } from '../providers/PlayBarProvider'
import { BeatCover } from './Covers'
import { EqBars, Eyebrow, PlayButton, Tag } from './ui'
import { accentFor, beatSubtitle } from '@/lib/beats'
import { cn } from '@/lib/utils'

function FeaturedBeatsSection({
  featuredBeats,
  allBeats
}: {
  featuredBeats: BeatTrack[]
  allBeats: Track[]
}) {
  const { isPlaying, setPlayPause, selectedTrack, setTrack, setQueue } =
    useContext(PlayBarContext)

  const handlePlay = async (track: BeatTrack) => {
    if (selectedTrack?.id === track.id && isPlaying) {
      setPlayPause(false)
    } else if (selectedTrack?.id === track.id && !isPlaying) {
      setPlayPause(true)
    } else {
      await setTrack(track)
      setQueue(track, allBeats)
    }
  }

  const [hero, ...rest] = featuredBeats
  if (!hero) return null

  const state = (beat: BeatTrack) => {
    const current = selectedTrack?.id === beat.id
    return { current, playing: current && isPlaying }
  }

  return (
    <div className='grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3'>
      <HeroCard
        beat={hero}
        {...state(hero)}
        onPlay={() => handlePlay(hero)}
        className='md:col-span-2 lg:row-span-2'
      />
      {rest.slice(0, 5).map((beat, i) => (
        <MiniCard
          key={beat.id}
          beat={beat}
          {...state(beat)}
          onPlay={() => handlePlay(beat)}
          className={cn(
            i === rest.length - 1 &&
              rest.length % 2 === 1 &&
              'md:col-span-2 lg:col-span-1'
          )}
        />
      ))}
    </div>
  )
}

type CardProps = {
  beat: BeatTrack
  current: boolean
  playing: boolean
  onPlay: () => void
  className?: string
}

function NowPlayingBadge({ playing }: { playing: boolean }) {
  return (
    <span className='inline-flex h-7 items-center gap-2 rounded-full border border-live/30 bg-live/10 px-3 font-mono text-[10.5px] tracking-[0.16em] text-live uppercase'>
      <EqBars playing={playing} className='h-3' />
      {playing ? 'Now playing' : 'Paused'}
    </span>
  )
}

function HeroCard({ beat, current, playing, onPlay, className }: CardProps) {
  const accent = accentFor(beat)
  const subtitle = beatSubtitle(beat)
  return (
    <article
      className={cn(
        'group surface relative isolate flex min-h-[380px] flex-col justify-between overflow-hidden rounded-3xl p-6 transition-[border-color] duration-300 hover:border-white/15 sm:p-8 lg:min-h-[480px]',
        className
      )}
      style={{
        backgroundImage: `radial-gradient(70% 90% at 85% 40%, ${accent}24, transparent 65%)`
      }}
    >
      <div className='relative z-10 flex items-start justify-between gap-3'>
        <div className='flex flex-col gap-3'>
          <Eyebrow color={accent}>Featured beat</Eyebrow>
          <div className='flex flex-wrap gap-1.5'>
            <Tag>{beat.genre}</Tag>
            {beat.mood && <Tag dot={accent}>{beat.mood}</Tag>}
          </div>
        </div>
        {current && <NowPlayingBadge playing={playing} />}
      </div>

      <BeatCover
        beat={beat}
        glow
        detail
        className='pointer-events-none absolute top-1/2 right-[-10%] w-[62%] max-w-[380px] -translate-y-[46%] rotate-[-6deg] rounded-[28px] opacity-90 transition-transform duration-500 ease-snap group-hover:rotate-[-3deg] sm:right-[-4%] sm:w-[48%]'
      />

      <div className='relative z-10 max-w-[62%] sm:max-w-[58%]'>
        <h3 className='font-display-wide text-[clamp(2.2rem,5.2vw,4.25rem)] text-balance text-bone'>
          {beat.title}
        </h3>
        {subtitle && (
          <p className='mt-3 text-base text-bone-muted sm:text-lg'>
            {subtitle}
          </p>
        )}
        <p className='tabular mt-1.5 font-mono text-xs tracking-[0.12em] text-bone-dim uppercase'>
          {beat.bpm} BPM{beat.key ? ` · ${beat.key}` : ''}
        </p>
        <div className='mt-7 flex items-center gap-4'>
          <PlayButton
            data-shot='play-featured'
            size='xl'
            tone='signal'
            playing={playing}
            label={`${playing ? 'Pause' : 'Play'} ${beat.title}`}
            onClick={onPlay}
            className='static after:absolute after:inset-0 after:rounded-3xl'
          />
          <span className='text-sm font-semibold text-bone'>
            {playing ? 'Pause' : current ? 'Resume' : 'Play now'}
          </span>
        </div>
      </div>
    </article>
  )
}

function MiniCard({ beat, current, playing, onPlay, className }: CardProps) {
  const accent = accentFor(beat)
  const subtitle = beatSubtitle(beat)
  return (
    <article
      className={cn(
        'group surface relative isolate flex items-center gap-4 overflow-hidden rounded-2xl p-3 pr-4 transition-[border-color,transform] duration-300 hover:border-white/15 sm:p-4 lg:flex-col lg:items-stretch lg:justify-between lg:gap-5 lg:p-5',
        current && 'border-live/30',
        className
      )}
      style={{
        backgroundImage: `radial-gradient(80% 70% at 0% 0%, ${accent}1a, transparent 70%)`
      }}
    >
      <div className='flex items-start justify-between gap-3'>
        <BeatCover
          beat={beat}
          className='size-16 rounded-xl transition-transform duration-500 ease-snap group-hover:scale-[1.04] sm:size-[72px]'
        />
        <div className='hidden lg:block'>
          {current ? (
            <NowPlayingBadge playing={playing} />
          ) : (
            <span className='tabular font-mono text-[11px] tracking-[0.12em] text-bone-dim uppercase'>
              {beat.bpm} BPM
            </span>
          )}
        </div>
      </div>

      <div className='flex min-w-0 flex-1 items-end justify-between gap-3'>
        <div className='min-w-0'>
          <h3
            className={cn(
              'font-display-tight truncate text-lg sm:text-xl',
              current ? 'text-live' : 'text-bone'
            )}
          >
            {beat.title}
          </h3>
          <p className='truncate text-sm text-bone-muted'>
            {subtitle ?? beat.genre}
          </p>
          <p className='tabular mt-1 truncate font-mono text-[10.5px] tracking-[0.12em] text-bone-dim uppercase lg:hidden'>
            {beat.genre} · {beat.bpm} BPM
          </p>
          <p className='mt-1 hidden truncate font-mono text-[10.5px] tracking-[0.12em] text-bone-dim uppercase lg:block'>
            {beat.genre}
            {beat.mood ? ` · ${beat.mood}` : ''}
          </p>
        </div>
        <PlayButton
          size='md'
          tone={current ? 'signal' : 'ghost'}
          playing={playing}
          label={`${playing ? 'Pause' : 'Play'} ${beat.title}`}
          onClick={onPlay}
          className='static after:absolute after:inset-0 after:rounded-2xl group-hover:bg-signal group-hover:text-ink-950 group-hover:ring-0'
        />
      </div>
    </article>
  )
}

export default FeaturedBeatsSection
