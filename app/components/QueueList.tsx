'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, Reorder, motion, useDragControls } from 'motion/react'
import { GripVertical, ListMusic, X } from 'lucide-react'
import type { BeatTrack } from '../models/Track'
import { usePlayer } from '../providers/PlayBarProvider'
import { TrackArt } from './Covers'
import { EqBars } from './ui'
import { RepeatButton, ShuffleButton, trackSubline } from './playerParts'
import type { QueueItem } from '@/lib/queue'
import { cn } from '@/lib/utils'

/** rows rendered at once; the rest follow in order */
const MAX_ROWS = 60

/**
 * The queue: what's playing, then up next. Rows play on tap, drag by their
 * handle to reorder (or focus the handle and use ↑ ↓), and can be removed.
 * Tracks you added yourself are marked "Queued".
 */
export function QueueList({ className }: { className?: string }) {
  const p = usePlayer()
  const upNext = p.upNext
  const byUid = useMemo(() => new Map(upNext.map(i => [i.uid, i])), [upNext])
  const shown = useMemo(() => upNext.slice(0, MAX_ROWS).map(i => i.uid), [upNext])

  // the order while a drag is in progress; committed when it ends
  const [dragOrder, setDragOrder] = useState<string[] | null>(null)
  const latest = useRef<string[] | null>(null)
  const order = (dragOrder ?? shown).filter(uid => byUid.has(uid))
  const [announcement, setAnnouncement] = useState('')

  // Keyboard focus follows the work: a moved row keeps it (React re-inserts
  // the row, which would drop it), a removed row hands it to a neighbour
  const rows = useRef(new Map<string, { handle?: HTMLButtonElement | null; remove?: HTMLButtonElement | null }>())
  const refocus = useRef<{ uid: string; part: 'handle' | 'remove' } | 'heading' | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => {
    const target = refocus.current
    if (!target) return
    refocus.current = null
    if (target === 'heading') heading.current?.focus()
    else rows.current.get(target.uid)?.[target.part]?.focus()
  })
  const register = (uid: string, part: 'handle' | 'remove') => (el: HTMLButtonElement | null) => {
    const entry = rows.current.get(uid) ?? {}
    entry[part] = el
    if (!entry.handle && !entry.remove) rows.current.delete(uid)
    else rows.current.set(uid, entry)
  }

  const remove = (uid: string) => {
    const at = order.indexOf(uid)
    const neighbour = order[at + 1] ?? order[at - 1]
    refocus.current = neighbour ? { uid: neighbour, part: 'remove' } : 'heading'
    p.remove(uid)
  }

  const clearQueued = () => {
    refocus.current = 'heading'
    p.clearQueue()
  }

  const commit = () => {
    const next = latest.current?.filter(uid => byUid.has(uid))
    latest.current = null
    setDragOrder(null)
    if (next && next.join() !== shown.join()) p.reorder(next)
  }

  const move = (uid: string, by: -1 | 1) => {
    const at = shown.indexOf(uid)
    const to = at + by
    if (at < 0 || to < 0 || to >= shown.length) return
    const next = [...shown]
    ;[next[at], next[to]] = [next[to], next[at]]
    refocus.current = { uid, part: 'handle' }
    p.reorder(next)
    const item = byUid.get(uid)
    setAnnouncement(`${item?.track.title ?? 'Track'} moved to position ${to + 1} of ${upNext.length}`)
  }

  const queued = upNext.filter(i => i.from === 'user').length

  if (!p.current) return null

  return (
    <div className={cn('flex flex-col', className)}>
      <p className='sr-only' aria-live='polite'>
        {announcement}
      </p>

      <h3 className='hud-label mb-2.5'>Now playing</h3>
      <NowRow item={p.current} playing={p.isPlaying} />

      <div className='mt-7 mb-2.5'>
        <div className='flex items-center justify-between gap-3'>
          <h3 ref={heading} tabIndex={-1} className='hud-label outline-none'>
            Up next
            <span className='tabular ml-2 text-bone-dim'>{upNext.length}</span>
          </h3>
          <div className='-mr-1.5 flex shrink-0 items-center'>
            <ShuffleButton />
            <RepeatButton />
          </div>
        </div>
        {(p.contextName || queued > 0) && (
          <div className='flex min-h-7 items-center justify-between gap-3'>
            <p className='min-w-0 truncate text-xs text-bone-dim'>
              {p.contextName && (
                <>
                  Playing from <span className='text-bone-muted'>{p.contextName}</span>
                </>
              )}
            </p>
            <AnimatePresence initial={false}>
              {queued > 0 && (
                <motion.button
                  type='button'
                  onClick={clearQueued}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className='-mr-1.5 shrink-0 rounded-md px-1.5 py-1 text-xs font-medium text-bone-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-bone'
                >
                  Clear queued
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {order.length ? (
        <Reorder.Group
          axis='y'
          values={order}
          onReorder={next => {
            latest.current = next
            setDragOrder(next)
          }}
          className='flex flex-col gap-0.5'
        >
          <AnimatePresence initial={false}>
            {order.map(uid => {
              const item = byUid.get(uid)!
              return (
                <QueueRow
                  key={uid}
                  item={item}
                  onPlay={() => p.jumpTo(uid)}
                  onRemove={() => remove(uid)}
                  onDragEnd={commit}
                  onMove={by => move(uid, by)}
                  handleRef={register(uid, 'handle')}
                  removeRef={register(uid, 'remove')}
                />
              )
            })}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        <div className='flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-8 text-center'>
          <ListMusic className='size-5 text-bone-dim' />
          <p className='text-sm font-medium text-bone'>Nothing up next</p>
          <p className='max-w-[18rem] text-xs text-bone-dim'>
            Use the ⋯ on any beat to play it next or add it to the queue.
          </p>
        </div>
      )}

      {upNext.length > MAX_ROWS && (
        <p className='py-3 text-center font-mono text-[11px] text-bone-dim'>
          +{upNext.length - MAX_ROWS} more
        </p>
      )}
    </div>
  )
}

function NowRow({ item, playing }: { item: QueueItem; playing: boolean }) {
  return (
    <div className='relative overflow-hidden rounded-xl bg-live/[0.07] p-2 ring-1 ring-live/20 ring-inset'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div
          key={item.uid}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ type: 'spring', stiffness: 460, damping: 36 }}
          className='flex items-center gap-3'
        >
          <TrackArt
            track={item.track as BeatTrack}
            className='size-11 rounded-lg'
            sizes='44px'
            live
          />
          <span className='min-w-0 flex-1'>
            <span className='block truncate text-sm font-semibold text-live'>
              {item.track.title}
            </span>
            <span className='block truncate text-xs text-bone-dim'>
              {trackSubline(item.track)}
            </span>
          </span>
          <EqBars playing={playing} className='mr-2' />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function QueueRow({
  item,
  onPlay,
  onRemove,
  onDragEnd,
  onMove,
  handleRef,
  removeRef
}: {
  item: QueueItem
  onPlay: () => void
  onRemove: () => void
  onDragEnd: () => void
  onMove: (by: -1 | 1) => void
  handleRef: (el: HTMLButtonElement | null) => void
  removeRef: (el: HTMLButtonElement | null) => void
}) {
  const controls = useDragControls()
  const [dragging, setDragging] = useState(false)
  const user = item.from === 'user'

  return (
    <Reorder.Item
      value={item.uid}
      dragListener={false}
      dragControls={controls}
      layout='position'
      onDragStart={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false)
        onDragEnd()
      }}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      // clip while growing/shrinking in; let the lifted shadow show while dragged
      className={cn('relative list-none', !dragging && 'overflow-hidden')}
    >
      <div
        className={cn(
          'group/q relative flex items-center gap-1 rounded-xl py-1.5 pr-1 pl-0.5 transition-[background-color,box-shadow] duration-150',
          dragging
            ? 'bg-ink-800 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.9)] ring-1 ring-white/10'
            : 'hover:bg-white/[0.045]'
        )}
      >
        <button
          ref={handleRef}
          type='button'
          aria-label={`Reorder ${item.track.title}. Use the up and down arrow keys to move it`}
          onPointerDown={e => {
            e.preventDefault()
            controls.start(e)
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              onMove(e.key === 'ArrowUp' ? -1 : 1)
            }
          }}
          className={cn(
            'flex h-10 w-7 shrink-0 touch-none items-center justify-center rounded-lg text-bone-dim transition-colors hover:text-bone focus-visible:text-bone',
            dragging ? 'cursor-grabbing text-bone' : 'cursor-grab'
          )}
        >
          <GripVertical className='size-4' />
        </button>

        <button
          type='button'
          onClick={onPlay}
          aria-label={`Play ${item.track.title}${user ? ' (queued by you)' : ''}`}
          className='flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left'
        >
          <TrackArt
            track={item.track as BeatTrack}
            className='size-10 rounded-lg'
            sizes='40px'
          />
          <span className='min-w-0 flex-1'>
            <span className='flex min-w-0 items-center gap-2'>
              <span className='truncate text-sm font-medium text-bone'>
                {item.track.title}
              </span>
              {user && (
                <span className='shrink-0 rounded-[5px] bg-live/12 px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.12em] text-live uppercase'>
                  Queued
                </span>
              )}
            </span>
            <span className='block truncate text-xs text-bone-dim'>
              {trackSubline(item.track)}
            </span>
          </span>
        </button>

        <button
          ref={removeRef}
          type='button'
          onClick={onRemove}
          aria-label={`Remove ${item.track.title} from the queue`}
          className='flex size-9 shrink-0 items-center justify-center rounded-full text-bone-dim opacity-100 transition-[opacity,color,background-color] hover:bg-white/[0.07] hover:text-bone focus-visible:opacity-100 md:opacity-0 md:group-hover/q:opacity-100 pointer-coarse:opacity-100'
        >
          <X className='size-4' />
        </button>
      </div>
    </Reorder.Item>
  )
}
