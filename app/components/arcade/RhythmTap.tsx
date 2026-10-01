'use client'

import { useEffect, useState } from 'react'
import { player } from '../../providers/player'
import { burst, kick } from '@/lib/arcade'
import { readBeat } from '@/lib/beatClock'
import { currentItem } from '@/lib/queue'
import { LOGO_GLITCH_EVENT } from '@/lib/stage'
import { unlock } from '@/lib/trophies'
import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------------------
   A rhythm game hiding in the empty space of every page. While a beat
   plays, tap along on anything that isn't a control: after three taps in
   time it says GO, then grades every tap (PERFECT, GREAT, GOOD or MISS)
   and counts the combo. Long combos light the place up.

   Taps are graded against your own groove, not the file's grid: the first
   taps set where "on the beat" is for you (which absorbs speaker latency,
   Bluetooth delay and where the beat sits in the file), and it follows you
   as you go. Tapping the off-beat is fine too; it's your groove.
--------------------------------------------------------------------------- */

type Grade = 'perfect' | 'great' | 'good'
type Tone = Grade | 'miss' | 'go' | 'note' | 'combo' | 'fever'
type Pop = { id: number; x: number; y: number; text: string; sub?: string; tone: Tone }

/** ms either side of your beat, and never more than that share of a beat */
const WINDOWS: Array<[Grade, number, number]> = [
  ['perfect', 34, 0.09],
  ['great', 68, 0.16],
  ['good', 100, 0.23]
]
const SYNC_TAPS = 3
/** beats without a tap: start again */
const MAX_GAP = 4.5
/** beats: quicker than this is mashing, not tapping */
const MIN_GAP = 0.4
const FEVER_MS = 6500
const POP_MS = 950

const NOT_EMPTY =
  'a, button, input, textarea, select, label, summary, video, audio, [role="button"], [role="slider"], [role="tab"], [role="menuitem"], [role="option"], [role="dialog"], [contenteditable="true"], [contenteditable=""], [data-no-rhythm]'

/** a phase difference folded into -0.5 … 0.5 of a beat */
const fold = (d: number) => d - Math.round(d)
const mixPhase = (from: number, to: number, amount: number) => {
  const p = from + fold(to - from) * amount
  return p - Math.floor(p)
}

const TONES: Record<Tone, string> = {
  perfect: 'rhythm-perfect text-[22px] text-theme',
  great: 'text-[19px] text-theme-2',
  good: 'text-[17px] text-bone',
  miss: 'text-[15px] text-bone-dim',
  go: 'rhythm-perfect text-[26px] text-live',
  note: 'text-[26px] text-theme',
  combo: 'rhythm-perfect text-[28px] text-warn',
  fever: 'rhythm-perfect text-[32px] text-theme-3'
}

export function RhythmTap() {
  const [pops, setPops] = useState<Pop[]>([])

  useEffect(() => {
    let ref = 0
    let synced = 0
    let combo = 0
    let misses = 0
    let lastPos = -Infinity
    let lastTrack = ''
    let nextId = 0
    let feverTimer = 0
    const timers = new Set<number>()
    let pending: {
      pointer: number
      pos: number
      bpm: number
      x: number
      y: number
      at: number
    } | null = null

    const show = (pop: Omit<Pop, 'id'>) => {
      const id = ++nextId
      setPops(list => [...list.slice(-7), { ...pop, id }])
      const t = window.setTimeout(() => {
        timers.delete(t)
        setPops(list => list.filter(p => p.id !== id))
      }, POP_MS)
      timers.add(t)
    }

    const startOver = () => {
      synced = 0
      combo = 0
      misses = 0
    }

    const fever = (x: number, y: number) => {
      const root = document.documentElement
      root.dataset.fever = ''
      window.dispatchEvent(new Event(LOGO_GLITCH_EVENT))
      show({ x, y: y - 64, text: 'Fever!', tone: 'fever' })
      window.clearTimeout(feverTimer)
      feverTimer = window.setTimeout(() => delete root.dataset.fever, FEVER_MS)
    }

    const judge = (pos: number, bpm: number, x: number, y: number) => {
      // a new track (or the same one restarted) is a new groove
      const track = currentItem(player.getState().queue)?.uid ?? ''
      if (track !== lastTrack) {
        lastTrack = track
        startOver()
        lastPos = -Infinity
      }
      const gap = pos - lastPos
      if (gap >= 0 && gap < MIN_GAP) return
      // stopped tapping for a while, or the track jumped back
      if (gap < 0 || gap > MAX_GAP) startOver()
      lastPos = pos

      const phase = pos - Math.floor(pos)
      const beatMs = 60000 / bpm
      const off = Math.abs(fold(phase - ref)) * beatMs
      const within = (ms: number, share: number) => off <= Math.min(ms, share * beatMs)

      // finding your groove: quiet until the taps agree
      if (synced === 0) {
        ref = phase
        synced = 1
        return
      }
      if (synced < SYNC_TAPS) {
        if (within(100, 0.23)) {
          ref = mixPhase(ref, phase, 0.5)
          synced++
          if (synced === SYNC_TAPS) {
            combo = 0
            show({ x, y, text: 'Go!', tone: 'go' })
          } else {
            show({ x, y, text: '♪', tone: 'note' })
          }
        } else {
          ref = phase
          synced = 1
        }
        return
      }

      const grade = WINDOWS.find(([, ms, share]) => within(ms, share))?.[0]
      if (!grade) {
        combo = 0
        misses++
        show({ x, y, text: 'Miss', tone: 'miss' })
        // lost it: find the groove again
        if (misses >= 2) startOver()
        return
      }
      misses = 0
      combo++
      ref = mixPhase(ref, phase, 0.18)

      const label = grade === 'perfect' ? 'Perfect' : grade === 'great' ? 'Great' : 'Good'
      const milestone = combo % 8 === 0
      if (milestone) {
        show({ x, y, text: `${combo} combo!`, sub: label, tone: 'combo' })
        burst({ x, y, count: combo >= 16 ? 40 : 20, power: combo >= 16 ? 1.25 : 0.9 })
        kick(1)
        if (combo >= 16) unlock('combo')
        if (combo % 32 === 0) fever(x, y)
      } else {
        show({ x, y, text: label, sub: combo > 1 ? `×${combo}` : undefined, tone: grade })
      }
      if (grade === 'perfect') {
        unlock('on-beat')
        if (!milestone) {
          kick(0.4)
          burst({ x, y, count: 6, power: 0.45 })
        }
      }
    }

    /** where in the beat the event happened (the handler runs a little later) */
    const beatAt = (e: PointerEvent) => {
      const beat = readBeat()
      if (!beat.playing) return null
      const lag = performance.now() - e.timeStamp
      const since = lag > 0 && lag < 1000 ? lag : 0
      return { pos: beat.beats - (since * beat.bpm) / 60000, bpm: beat.bpm }
    }

    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0) return
      if (document.documentElement.dataset.stage) return
      const target = e.target
      if (!(target instanceof Element) || target.closest(NOT_EMPTY)) return
      const at = beatAt(e)
      if (!at) return
      if (e.pointerType === 'mouse') {
        judge(at.pos, at.bpm, e.clientX, e.clientY)
      } else {
        // a touch is graded when it lifts (it might be a scroll), from
        // when it landed
        pending = {
          pointer: e.pointerId,
          ...at,
          x: e.clientX,
          y: e.clientY,
          at: performance.now()
        }
      }
    }
    const onUp = (e: PointerEvent) => {
      const p = pending
      if (!p || e.pointerId !== p.pointer) return
      pending = null
      const moved = Math.hypot(e.clientX - p.x, e.clientY - p.y)
      if (moved > 14 || performance.now() - p.at > 450) return
      // above the finger, where it can be seen
      judge(p.pos, p.bpm, p.x, p.y - 36)
    }
    const onCancel = (e: PointerEvent) => {
      if (pending?.pointer === e.pointerId) pending = null
    }

    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onCancel, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      timers.forEach(t => window.clearTimeout(t))
      window.clearTimeout(feverTimer)
      delete document.documentElement.dataset.fever
    }
  }, [])

  return (
    <div aria-hidden className='pointer-events-none fixed inset-0 z-[86] overflow-hidden'>
      {pops.map(pop => (
        <span
          key={pop.id}
          className={cn(
            'absolute font-pixel leading-none whitespace-nowrap uppercase',
            pop.tone === 'miss' ? 'rhythm-miss' : 'rhythm-pop',
            TONES[pop.tone]
          )}
          style={{ left: pop.x, top: pop.y }}
        >
          {pop.text}
          {pop.sub && (
            <span className='mt-1.5 block text-center text-[11px] tracking-[0.24em] text-bone'>
              {pop.sub}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
