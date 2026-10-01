'use client'

import { useState, useSyncExternalStore } from 'react'
import { Lock } from 'lucide-react'
import {
  TOTAL_POINTS,
  TROPHIES,
  readSave,
  resetSave,
  serverSave,
  subscribeSave,
  type Trophy
} from '@/lib/trophies'
import { cn } from '@/lib/utils'
import { BRAND_GRADIENT } from '../brand/Wordmark'
import { SectionHeader } from '../ui'
import { TrophyIcon } from './TrophyIcon'

const GOLD_TILE =
  'bg-[linear-gradient(135deg,#FFE08A,#FFB547_45%,#FF8A2E)] text-ink-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.5),0_10px_26px_-12px_rgb(255_181_71/0.9)]'

/** The visitor's trophies (About page): what's unlocked, and hints for the rest. */
export function TrophyCase({ className }: { className?: string }) {
  const save = useSyncExternalStore(subscribeSave, readSave, serverSave)
  const [confirming, setConfirming] = useState(false)
  const got = TROPHIES.filter(t => save.unlocked[t.id])
  const points = got.reduce((sum, t) => sum + t.points, 0)
  const regular = TROPHIES.filter(t => t.id !== 'completionist')
  const final = TROPHIES.find(t => t.id === 'completionist')!

  return (
    <section
      id='trophies'
      aria-labelledby='trophies-title'
      className={cn('scroll-mt-[calc(var(--nav-h)+24px)]', className)}
    >
      <SectionHeader
        id='trophies-title'
        eyebrow='Player 2 (that’s you)'
        title='Trophy case'
        action={
          <p className='hud-label tabular text-bone-muted'>
            <span className='text-warn'>{got.length}</span>/{TROPHIES.length} ·{' '}
            <span className='text-warn'>{points}</span>/{TOTAL_POINTS} G
          </p>
        }
      />

      {/* one LED per trophy */}
      <div
        role='progressbar'
        aria-label='Trophies unlocked'
        aria-valuemin={0}
        aria-valuemax={TROPHIES.length}
        aria-valuenow={got.length}
        className='mb-4 flex gap-1'
      >
        {TROPHIES.map((t, i) => (
          <span
            key={t.id}
            className={cn(
              'h-2 flex-1 rounded-[2px] transition-[background-color,box-shadow] duration-500',
              i < got.length
                ? 'bg-warn shadow-[0_0_10px_rgb(255_181_71/0.55)]'
                : 'bg-white/[0.07]'
            )}
          />
        ))}
      </div>

      <ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {regular.map(trophy => (
          <TrophyCard key={trophy.id} trophy={trophy} at={save.unlocked[trophy.id]} />
        ))}
        <TrophyCard trophy={final} at={save.unlocked.completionist} final />
      </ul>

      <div className='mt-4 flex min-h-8 flex-wrap items-center justify-between gap-3 text-xs'>
        <p className='text-bone-dim'>Saved on this device only.</p>
        {got.length > 0 &&
          (confirming ? (
            <p className='flex items-center gap-3 text-bone-muted'>
              Erase {got.length} {got.length === 1 ? 'trophy' : 'trophies'}?
              <button
                type='button'
                onClick={() => {
                  resetSave()
                  setConfirming(false)
                }}
                className='rounded-md px-1.5 py-1 font-semibold text-signal-hi hover:bg-signal/10'
              >
                Erase
              </button>
              <button
                type='button'
                onClick={() => setConfirming(false)}
                className='rounded-md px-1.5 py-1 font-semibold text-bone hover:bg-white/[0.06]'
              >
                Keep
              </button>
            </p>
          ) : (
            <button
              type='button'
              onClick={() => setConfirming(true)}
              className='hud-label rounded-md px-1.5 py-1 transition-colors hover:text-bone'
            >
              Reset save file
            </button>
          ))}
      </div>
    </section>
  )
}

function TrophyCard({
  trophy,
  at,
  final = false
}: {
  trophy: Trophy
  at?: number
  final?: boolean
}) {
  const unlocked = !!at
  const hidden = trophy.secret && !unlocked
  return (
    <li
      className={cn(
        'glow-card flex items-center gap-4 rounded-2xl p-4',
        unlocked
          ? 'surface'
          : 'border border-dashed border-line-strong bg-white/[0.015]'
      )}
      style={
        {
          '--glow': unlocked ? (final ? '#C83ADE' : '#FFB547') : 'var(--color-bone-dim)'
        } as React.CSSProperties
      }
    >
      <span
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-xl transition-[scale,rotate] duration-300 ease-pad lit:scale-110 lit:-rotate-6',
          unlocked
            ? final
              ? 'text-white shadow-[0_10px_26px_-12px_rgb(200_58_222/0.9)]'
              : GOLD_TILE
            : 'bg-white/[0.04] text-bone-dim ring-1 ring-white/8 ring-inset'
        )}
        style={unlocked && final ? { backgroundImage: BRAND_GRADIENT } : undefined}
      >
        {unlocked ? (
          <TrophyIcon id={trophy.id} className='size-[22px]' />
        ) : (
          <Lock aria-hidden className='size-[18px]' />
        )}
      </span>
      <span className='min-w-0 flex-1'>
        <span className='flex items-baseline justify-between gap-3'>
          <span
            className={cn(
              'font-display-tight truncate text-[17px]',
              unlocked ? 'text-bone' : 'text-bone-muted'
            )}
          >
            {hidden ? 'Secret trophy' : trophy.name}
            <span className='sr-only'>{unlocked ? ' (unlocked)' : ' (locked)'}</span>
          </span>
          <span
            className={cn(
              'tabular shrink-0 font-mono text-[11px]',
              unlocked ? 'text-warn' : 'text-bone-dim'
            )}
          >
            {trophy.points} G
          </span>
        </span>
        <span className='mt-0.5 block text-[13px] leading-snug text-bone-dim'>
          {unlocked ? trophy.done : trophy.hint}
        </span>
        {at && (
          <span className='mt-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-bone-dim uppercase'>
            Unlocked{' '}
            {new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </span>
    </li>
  )
}
