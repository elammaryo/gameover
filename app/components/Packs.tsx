'use client'

import Link from 'next/link'
import type { BeatTrack } from '../models/Track'
import { PackCover } from './Covers'
import { PlayButton } from './ui'
import { useBeatPlayback } from './usePlayback'
import { averageBpm, packBeats } from '@/lib/beats'
import { cn } from '@/lib/utils'

export type BeatPack = {
  id: string
  name: string
  description?: string | null
  trackIds?: string[]
}

export const packHref = (pack: Pick<BeatPack, 'name'>) =>
  `/studio/playlist/${encodeURIComponent(pack.name.toLowerCase())}`

/**
 * `tile`: big cover on top from `sm` up (a row on phones).
 * `row`: always a compact row, for secondary shelves like "More packs".
 */
export function PackCard({
  pack,
  beats,
  layout = 'tile',
  className
}: {
  pack: BeatPack
  beats: BeatTrack[]
  layout?: 'tile' | 'row'
  className?: string
}) {
  const { playAll, listState } = useBeatPlayback()
  const list = packBeats(pack.trackIds, beats)
  const { current, playing } = listState(list)
  const tile = layout === 'tile'

  return (
    <article
      className={cn(
        'group surface relative isolate flex items-center gap-4 rounded-2xl p-2.5 transition-[border-color,translate,scale] duration-300 ease-snap hover:border-white/15',
        tile && 'sm:flex-col sm:items-stretch sm:p-3 sm:hover:-translate-y-0.5',
        current && 'border-live/30',
        className
      )}
    >
      <PackCover
        name={pack.name}
        detail
        glow
        className={cn(
          'size-20 rounded-xl transition-transform duration-500 ease-snap group-hover:scale-[1.015]',
          tile && 'sm:size-auto sm:w-full'
        )}
      />
      <div
        className={cn(
          'flex min-w-0 flex-1 items-center justify-between gap-3',
          tile && 'sm:items-end sm:px-1.5 sm:pb-1.5'
        )}
      >
        <div className='min-w-0'>
          <h3 className='truncate'>
            <Link
              href={packHref(pack)}
              className='font-display-tight text-xl text-bone after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none'
            >
              {pack.name}
            </Link>
          </h3>
          <p className='tabular mt-2 font-mono text-[11px] tracking-[0.12em] text-bone-dim uppercase'>
            {list.length} beats · {averageBpm(list)} BPM avg
          </p>
        </div>
        <PlayButton
          size='md'
          tone={current ? 'accent' : 'ghost'}
          playing={playing}
          label={`${playing ? 'Pause' : 'Play'} the ${pack.name} pack`}
          onClick={() => playAll(list)}
          disabled={!list.length}
          className='relative z-10'
        />
      </div>
    </article>
  )
}

export function PackGrid({
  packs,
  beats,
  layout = 'tile',
  className
}: {
  packs: BeatPack[]
  beats: BeatTrack[]
  layout?: 'tile' | 'row'
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 [&>article:has(a:focus-visible)]:ring-2 [&>article:has(a:focus-visible)]:ring-live',
        className
      )}
    >
      {packs.map(pack => (
        <PackCard key={pack.id} pack={pack} beats={beats} layout={layout} />
      ))}
    </div>
  )
}
