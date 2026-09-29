'use client'

import { Play } from 'lucide-react'
import type { BeatTrack } from '../models/Track'
import { BeatCover } from './Covers'
import { EqBars, PlayButton, Tag } from './ui'
import { useBeatPlayback } from './usePlayback'
import { accentFor, beatSubtitle } from '@/lib/beats'
import { cn } from '@/lib/utils'

const COLS =
  'md:grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,9rem)_3.5rem_6rem_7.5rem_2.5rem] lg:grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,11rem)_4rem_6.5rem_8rem_2.5rem]'

/**
 * The studio tracklist: number, generated cover, title / type-beat line,
 * genre, tempo, key, mood. The whole row plays; the list becomes the queue.
 */
export function BeatList({
  beats,
  queue = beats,
  showHeader = true,
  className
}: {
  beats: BeatTrack[]
  /** what plays next; defaults to the visible list */
  queue?: BeatTrack[]
  showHeader?: boolean
  className?: string
}) {
  const { toggle, stateOf } = useBeatPlayback()

  return (
    <div className={className}>
      {showHeader && (
        <div
          aria-hidden
          className={cn(
            'hud-label hidden items-center gap-4 border-b border-line px-3 pb-3 md:grid',
            COLS
          )}
        >
          <span className='text-center'>#</span>
          <span>Title</span>
          <span>Genre</span>
          <span>BPM</span>
          <span>Key</span>
          <span>Mood</span>
          <span />
        </div>
      )}
      <ol className='mt-2 flex flex-col gap-0.5'>
        {beats.map((beat, i) => {
          const { current, playing } = stateOf(beat.id)
          const subtitle = beatSubtitle(beat)
          return (
            <li
              key={beat.id}
              className={cn(
                'group/row relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-live md:gap-4 md:px-3',
                COLS,
                current
                  ? 'bg-live/[0.07] hover:bg-live/[0.1]'
                  : 'hover:bg-white/[0.04]'
              )}
            >
              {/* index, or a live meter for the current beat */}
              <span className='relative hidden size-9 items-center justify-center md:flex'>
                {current ? (
                  playing ? (
                    <EqBars />
                  ) : (
                    <Play
                      className='size-3.5 text-live'
                      fill='currentColor'
                      strokeWidth={0}
                    />
                  )
                ) : (
                  <>
                    <span className='tabular font-mono text-xs text-bone-dim transition-opacity group-hover/row:opacity-0'>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Play
                      aria-hidden
                      className='absolute size-3.5 text-bone opacity-0 transition-opacity group-hover/row:opacity-100'
                      fill='currentColor'
                      strokeWidth={0}
                    />
                  </>
                )}
              </span>

              <span className='flex min-w-0 items-center gap-3'>
                <BeatCover
                  beat={beat}
                  className='size-11 rounded-lg sm:size-12'
                  glow={current}
                />
                <span className='min-w-0'>
                  <span
                    className={cn(
                      'flex min-w-0 items-center gap-2 text-[15px] font-semibold',
                      current ? 'text-live' : 'text-bone'
                    )}
                  >
                    <span className='truncate'>{beat.title}</span>
                    {current && playing && <EqBars className='md:hidden' />}
                  </span>
                  <span className='block truncate text-[13px] text-bone-dim md:hidden'>
                    {subtitle ?? beat.genre} · {beat.bpm} BPM
                  </span>
                  {subtitle && (
                    <span className='hidden truncate text-[13px] text-bone-dim md:block'>
                      {subtitle}
                    </span>
                  )}
                </span>
              </span>

              <span className='hidden truncate text-sm text-bone-muted md:block'>
                {beat.genre}
              </span>
              <span className='tabular hidden font-mono text-sm text-bone-muted md:block'>
                {beat.bpm}
              </span>
              <span className='hidden truncate text-sm text-bone-muted md:block'>
                {beat.key ?? <span className='text-bone-dim'>—</span>}
              </span>
              <span className='hidden md:block'>
                {beat.mood ? (
                  <Tag dot={accentFor(beat)}>{beat.mood}</Tag>
                ) : (
                  <span className='text-sm text-bone-dim'>—</span>
                )}
              </span>

              <PlayButton
                size='md'
                tone={current ? 'signal' : 'ghost'}
                playing={playing}
                label={`${playing ? 'Pause' : 'Play'} ${beat.title}`}
                onClick={() => toggle(beat, queue)}
                className={cn(
                  'static justify-self-end after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none md:size-9',
                  !current && 'group-hover/row:bg-white/[0.12]'
                )}
              />
            </li>
          )
        })}
      </ol>
    </div>
  )
}
