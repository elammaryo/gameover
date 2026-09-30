'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { SiSoundcloud } from 'react-icons/si'
import { getBeats, getBeatsPlaylists } from '../api'
import type { Playlist } from '../models/Playlist'
import type { BeatTrack } from '../models/Track'
import FeaturedBeatsSection from '../components/FeaturedBeatCard'
import { BeatList } from '../components/BeatList'
import { CountUp } from '../components/CountUp'
import { PackGrid } from '../components/Packs'
import {
  CtaBand,
  EmptyState,
  FilterChip,
  Page,
  PageHeader,
  SectionHeader,
  StatStrip,
  Tabs
} from '../components/ui'
import {
  GENRE_FAMILIES,
  LOCAL_BEATS,
  LOCAL_PACKS,
  averageBpm,
  inFamily,
  matchesQuery,
  pickFeatured,
  type GenreFamilyId
} from '@/lib/beats'
import { STAGE_REVEAL_EVENT, stageActive } from '@/lib/stage'
import { SOUNDCLOUD_URL } from '@/lib/site'

type View = 'beats' | 'packs'
type Sort = 'latest' | 'bpm-asc' | 'bpm-desc' | 'az'

const SORTS: Array<{ id: Sort; label: string }> = [
  { id: 'latest', label: 'Latest' },
  { id: 'bpm-asc', label: 'BPM: low to high' },
  { id: 'bpm-desc', label: 'BPM: high to low' },
  { id: 'az', label: 'Title: A–Z' }
]

function sortBeats(beats: BeatTrack[], sort: Sort) {
  if (sort === 'latest') return beats
  const copy = [...beats]
  if (sort === 'az') return copy.sort((a, b) => a.title.localeCompare(b.title))
  return copy.sort((a, b) => (sort === 'bpm-asc' ? a.bpm - b.bpm : b.bpm - a.bpm))
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const readHash = () => window.location.hash

function isTyping(el: EventTarget | null) {
  return (
    el instanceof HTMLElement &&
    (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
  )
}

export default function Studio() {
  // the catalogue ships with the page, so the studio is ready the moment it
  // appears (no loading state behind the stage transition); the API still
  // gets the final word
  const [beats, setBeats] = useState<BeatTrack[]>(LOCAL_BEATS)
  const [packs, setPacks] = useState<Playlist[]>(LOCAL_PACKS)
  // rows cascade in on arrival only, not on every filter change
  const [arriving, setArriving] = useState(true)
  // the tab lives in the URL hash, so coming back from a pack lands on Packs
  const hash = useSyncExternalStore(subscribeToHash, readHash, () => '')
  const [picked, setPicked] = useState<View | null>(null)
  const view: View = picked ?? (hash === '#packs' ? 'packs' : 'beats')
  const [family, setFamily] = useState<GenreFamilyId | 'all'>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('latest')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getBeats()
      .then(fresh => fresh.length && setBeats(fresh))
      .catch(error => console.error('Error fetching beats:', error))

    getBeatsPlaylists()
      .then(fresh => fresh.length && setPacks(fresh))
      .catch(error => console.error('Error fetching packs:', error))
  }, [])

  useEffect(() => {
    let timer = 0
    const settle = () => {
      timer = window.setTimeout(() => setArriving(false), 2600)
    }
    if (stageActive()) window.addEventListener(STAGE_REVEAL_EVENT, settle, { once: true })
    else settle()
    return () => {
      window.removeEventListener(STAGE_REVEAL_EVENT, settle)
      window.clearTimeout(timer)
    }
  }, [])

  const changeView = (next: View) => {
    setPicked(next)
    const url = next === 'packs' ? '#packs' : window.location.pathname
    window.history.replaceState(null, '', url)
  }

  // "/" jumps to search, like most music apps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping(e.target)) return
      e.preventDefault()
      setPicked('beats')
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
      requestAnimationFrame(() => searchRef.current?.focus())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const featured = useMemo(() => pickFeatured(beats), [beats])

  const families = useMemo(
    () =>
      GENRE_FAMILIES.map(f => ({
        ...f,
        count: beats.filter(b => f.test(b.genre ?? '')).length
      })).filter(f => f.count > 0),
    [beats]
  )

  const visible = useMemo(
    () =>
      sortBeats(
        beats.filter(b => inFamily(b, family) && matchesQuery(b, query)),
        sort
      ),
    [beats, family, query, sort]
  )

  const filtered = family !== 'all' || query.trim() !== ''

  // what the queue shows as "Playing from …"
  const listContext = useMemo(() => {
    const q = query.trim()
    const fam = GENRE_FAMILIES.find(f => f.id === family)
    const name = q ? `“${q}” in the studio` : fam ? `Studio · ${fam.label}` : 'Studio beats'
    return { id: `studio:${family}:${q.toLowerCase()}:${sort}`, name }
  }, [family, query, sort])
  const clearFilters = () => {
    setFamily('all')
    setQuery('')
  }

  return (
    <Page>
      <PageHeader eyebrow='GameOver Studio' title='The sound lab'>
        Hard-hitting trap, drill and hip-hop, made for artists. Press play on
        anything below, or dig through the packs.
      </PageHeader>

      <StatStrip
        className='mt-10 sm:mt-12'
        items={[
          { label: 'Beats', value: <CountUp value={beats.length} /> },
          { label: 'Packs', value: <CountUp value={packs.length} /> },
          {
            label: 'Genres',
            value: <CountUp value={new Set(beats.map(b => b.genre)).size} />
          },
          {
            label: 'Avg tempo',
            value: <CountUp value={averageBpm(beats)} duration={1400} />,
            hint: 'BPM'
          }
        ]}
      />

      {/* FEATURED */}
      <section aria-labelledby='featured-title' className='mt-20 sm:mt-24'>
        <div
          className='intro-rise'
          style={{ '--i': 6 } as React.CSSProperties}
        >
          <SectionHeader
            id='featured-title'
            eyebrow='Featured'
            title='Hand-picked heat'
          />
        </div>
        {featured.length ? (
          <FeaturedBeatsSection featuredBeats={featured} allBeats={beats} />
        ) : (
          <EmptyState title='The featured shelf is empty'>
            Beats couldn’t load right now. Refresh to try again.
          </EmptyState>
        )}
      </section>

      {/* LIBRARY */}
      <section
        id='packs'
        aria-label='Library'
        className='mt-20 scroll-mt-[calc(var(--nav-h)+24px)] sm:mt-28'
      >
        <div
          className='intro-rise flex flex-col gap-3 border-b border-line pb-4'
          style={{ '--i': 8 } as React.CSSProperties}
        >
          <p className='hud-label'>Library</p>
          <Tabs
            idPrefix='library'
            value={view}
            onChange={changeView}
            tabs={[
              {
                id: 'beats',
                label: 'Beats',
                count: beats.length
              },
              {
                id: 'packs',
                label: 'Packs',
                count: packs.length,
                shot: 'tab-packs'
              }
            ]}
          />
        </div>

        <div
          id='library-panel'
          role='tabpanel'
          aria-labelledby={`library-tab-${view}`}
          className='pt-6'
        >
          {view === 'beats' ? (
            <>
              <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-3 sm:flex-row'>
                  <label className='group/search relative flex-1'>
                    <span className='sr-only'>Search beats</span>
                    <Search
                      aria-hidden
                      className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-bone-dim transition-colors group-focus-within/search:text-bone'
                    />
                    <input
                      ref={searchRef}
                      type='search'
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') {
                          setQuery('')
                          e.currentTarget.blur()
                        }
                      }}
                      placeholder='Search title, artist, mood, key…'
                      autoComplete='off'
                      spellCheck={false}
                      className='h-12 w-full rounded-xl border border-line-strong bg-ink-900/80 pr-20 pl-11 text-[15px] text-bone transition-[border-color,box-shadow] outline-none placeholder:text-bone-dim hover:border-white/20 focus:border-live/60 focus:shadow-[0_0_0_4px_rgb(59_231_255/0.12)]'
                    />
                    {query ? (
                      <button
                        type='button'
                        onClick={() => {
                          setQuery('')
                          searchRef.current?.focus()
                        }}
                        aria-label='Clear search'
                        className='absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-bone-dim transition-colors hover:bg-white/[0.06] hover:text-bone'
                      >
                        <X className='size-4' />
                      </button>
                    ) : (
                      <kbd
                        aria-hidden
                        className='pointer-events-none absolute top-1/2 right-3 hidden h-6 -translate-y-1/2 items-center rounded-md border border-line-strong px-2 font-mono text-[11px] text-bone-dim sm:flex'
                      >
                        /
                      </kbd>
                    )}
                  </label>

                  <label className='relative sm:w-56'>
                    <span className='sr-only'>Sort beats</span>
                    <select
                      value={sort}
                      onChange={e => setSort(e.target.value as Sort)}
                      className='h-12 w-full cursor-pointer appearance-none rounded-xl border border-line-strong bg-ink-900/80 pr-10 pl-4 text-[15px] text-bone transition-colors outline-none hover:border-white/20 focus:border-live/60'
                    >
                      {SORTS.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden
                      className='pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-bone-dim'
                    />
                  </label>
                </div>

                <div
                  role='group'
                  aria-label='Filter by genre'
                  className='-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden'
                >
                  <FilterChip
                    active={family === 'all'}
                    count={beats.length}
                    onClick={() => setFamily('all')}
                  >
                    All
                  </FilterChip>
                  {families.map(f => (
                    <FilterChip
                      key={f.id}
                      active={family === f.id}
                      count={f.count}
                      onClick={() =>
                        setFamily(current => (current === f.id ? 'all' : f.id))
                      }
                    >
                      {f.label}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className='mt-6 flex min-h-5 items-center justify-between gap-4'>
                <p
                  className='hud-label tabular'
                  aria-live='polite'
                  aria-atomic='true'
                >
                  {filtered
                    ? `${visible.length} of ${beats.length} beats`
                    : `${beats.length} beats`}
                </p>
                {filtered && (
                  <button
                    type='button'
                    onClick={clearFilters}
                    className='hud-label rounded-md px-1 py-1 text-bone-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-bone'
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {visible.length ? (
                <BeatList
                  beats={visible}
                  context={listContext}
                  className='mt-3'
                  intro={arriving}
                />
              ) : beats.length ? (
                <EmptyState
                  className='mt-4'
                  title={
                    query.trim()
                      ? `Nothing matches “${query.trim()}”`
                      : 'No beats in this genre yet'
                  }
                  action={
                    <button
                      type='button'
                      onClick={clearFilters}
                      className='h-10 rounded-xl border border-line-strong px-4 text-sm font-semibold text-bone transition-colors hover:bg-white/[0.05]'
                    >
                      Clear filters
                    </button>
                  }
                >
                  Try a different word, or browse everything.
                </EmptyState>
              ) : (
                <EmptyState className='mt-4' title='No beats available yet'>
                  Check back soon, or catch the latest on SoundCloud.
                </EmptyState>
              )}
            </>
          ) : packs.length ? (
            <PackGrid packs={packs} beats={beats} />
          ) : (
            <EmptyState title='No packs yet'>
              Packs group beats by vibe. The first ones are on the way.
            </EmptyState>
          )}
        </div>
      </section>

      <CtaBand
        className='mt-24 sm:mt-32'
        icon={<SiSoundcloud />}
        accent='var(--color-soundcloud)'
        variant='soundcloud'
        title='More on SoundCloud'
        href={SOUNDCLOUD_URL}
        cta='Listen on SoundCloud'
      >
        Exclusive releases, demos and experiments that haven’t made it to the
        studio yet.
      </CtaBand>
    </Page>
  )
}
