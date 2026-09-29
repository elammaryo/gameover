'use client'

import { useEffect, useMemo, useState } from 'react'
import { notFound, useParams } from 'next/navigation'
import { Pause, Play, Shuffle } from 'lucide-react'
import { SiSoundcloud } from 'react-icons/si'
import { getBeats } from '@/app/api'
import type { BeatTrack } from '@/app/models/Track'
import beatsPlaylistsData from '@/app/api/beats/playlists.json'
import { BeatList } from '@/app/components/BeatList'
import { Button, buttonClasses } from '@/app/components/Button'
import { PackCover } from '@/app/components/Covers'
import { PackGrid, type BeatPack } from '@/app/components/Packs'
import {
  BackLink,
  EmptyState,
  Eyebrow,
  Page,
  SectionHeader,
  Skeleton,
  Tag
} from '@/app/components/ui'
import { useBeatPlayback } from '@/app/components/usePlayback'
import {
  accentFor,
  averageBpm,
  packAccent,
  packBeats,
  uniqueValues
} from '@/lib/beats'
import { SOUNDCLOUD_URL } from '@/lib/site'

const PACKS = beatsPlaylistsData as BeatPack[]

export default function BeatPackPage() {
  const params = useParams()
  const slug = decodeURIComponent(String(params.id ?? '')).toLowerCase()
  const pack = PACKS.find(p => p.name.toLowerCase() === slug)

  const [beats, setBeats] = useState<BeatTrack[]>([])
  const [loading, setLoading] = useState(true)
  const { playAll, listState } = useBeatPlayback()

  useEffect(() => {
    getBeats()
      .then(setBeats)
      .catch(error => console.error('Error fetching beats:', error))
      .finally(() => setLoading(false))
  }, [])

  const list = useMemo(() => packBeats(pack?.trackIds, beats), [pack, beats])

  if (!pack) notFound()

  const { current, playing } = listState(list)
  const accent = packAccent(pack.name)
  const genres = uniqueValues(list.map(b => b.genre))
  const moods = uniqueValues(list.map(b => b.mood))
  const others = PACKS.filter(p => p.id !== pack.id)

  return (
    <Page>
      <BackLink href='/studio#packs'>Studio · Packs</BackLink>

      <header className='mt-6 grid gap-8 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-end md:grid-cols-[minmax(0,18rem)_1fr] md:gap-12'>
        <PackCover
          name={pack.name}
          detail
          glow
          className='w-full max-w-[18rem] rounded-3xl shadow-[0_40px_90px_-40px_rgb(0_0_0/0.9)]'
        />

        <div className='flex min-w-0 flex-col gap-5'>
          <Eyebrow color={accent}>Beat pack</Eyebrow>
          <h1 className='font-display-wide text-[clamp(2.6rem,11vw,6.5rem)] break-words text-bone'>
            {pack.name}
          </h1>
          {pack.description && (
            <p className='max-w-xl text-lg text-bone-muted'>
              {pack.description}
            </p>
          )}
          <p className='tabular font-mono text-xs tracking-[0.14em] text-bone-dim uppercase'>
            GameOver ·{' '}
            {loading ? '…' : `${list.length} beats · ${averageBpm(list)} BPM avg`}
          </p>

          <div className='flex flex-wrap items-center gap-3'>
            <Button
              size='lg'
              onClick={() => playAll(list)}
              disabled={loading || !list.length}
            >
              {playing ? (
                <Pause className='size-4' fill='currentColor' strokeWidth={0} />
              ) : (
                <Play className='size-4' fill='currentColor' strokeWidth={0} />
              )}
              {playing ? 'Pause' : current ? 'Resume' : 'Play pack'}
            </Button>
            <Button
              size='lg'
              variant='secondary'
              onClick={() => playAll(list, { shuffle: true })}
              disabled={loading || list.length < 2}
            >
              <Shuffle className='size-4' />
              Shuffle
            </Button>
            <a
              href={SOUNDCLOUD_URL}
              target='_blank'
              rel='noopener noreferrer'
              className={buttonClasses({ variant: 'ghost', size: 'lg' })}
            >
              <SiSoundcloud className='size-4' />
              SoundCloud
            </a>
          </div>
        </div>
      </header>

      {!loading && list.length > 0 && (
        <dl className='mt-10 flex flex-col gap-4 border-y border-line py-5 sm:flex-row sm:gap-12'>
          <div className='flex flex-col gap-2.5'>
            <dt className='hud-label'>Genres</dt>
            <dd className='flex flex-wrap gap-1.5'>
              {genres.map(g => (
                <Tag key={g}>{g}</Tag>
              ))}
            </dd>
          </div>
          {moods.length > 0 && (
            <div className='flex flex-col gap-2.5'>
              <dt className='hud-label'>Vibes</dt>
              <dd className='flex flex-wrap gap-1.5'>
                {moods.map(m => (
                  <Tag
                    key={m}
                    dot={accentFor({ id: m, mood: m })}
                  >
                    {m}
                  </Tag>
                ))}
              </dd>
            </div>
          )}
        </dl>
      )}

      <section aria-label={`${pack.name} beats`} className='mt-8'>
        {loading ? (
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className='h-[60px]' />
            ))}
          </div>
        ) : list.length ? (
          <BeatList beats={list} />
        ) : (
          <EmptyState title='This pack is empty for now'>
            Its beats couldn’t load. Refresh to try again.
          </EmptyState>
        )}
      </section>

      {others.length > 0 && (
        <section aria-labelledby='more-packs' className='mt-20 sm:mt-28'>
          <SectionHeader id='more-packs' eyebrow='Keep digging' title='More packs' />
          <PackGrid
            packs={others}
            beats={beats}
            layout='row'
            className='lg:grid-cols-3'
          />
        </section>
      )}
    </Page>
  )
}
