'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import packs from '../../api/beats/playlists.json'
import { player } from '../../providers/player'
import {
  DROP_EVENT,
  gameOver,
  isTyping,
  kick,
  markGesture,
  reducedMotion
} from '@/lib/arcade'
import { currentItem } from '@/lib/queue'
import { readSfx, sfx } from '@/lib/sfx'
import { HIT_EVENT, LOGO_GLITCH_EVENT, STAGE_REVEAL_EVENT } from '@/lib/stage'
import { themeFor } from '@/lib/theme'
import {
  STAGES_TO_VISIT,
  checkComplete,
  notePack,
  notePage,
  noteQueued,
  unlock
} from '@/lib/trophies'
import { GameOverScreen } from './GameOverScreen'
import { Particles } from './Particles'
import { RhythmTap } from './RhythmTap'
import { TrophyToast } from './TrophyToast'
import { useGlowTracker } from './useGlowTracker'

const PACKS = packs.map(p => p.name.toLowerCase())
const SECTIONS: readonly string[] = STAGES_TO_VISIT

/**
 * The arcade layer, mounted once in the root layout: the glow on cards,
 * trophies for what you do, the typed codes ("gameover", "808"), the tap
 * along rhythm game, pixel bursts and the GAME OVER screen.
 */
export function Arcade() {
  const pathname = usePathname()
  const [drop, setDrop] = useState(0)
  useGlowTracker()

  // where you go
  useEffect(() => {
    const section = themeFor(pathname)
    if (SECTIONS.includes(section)) notePage(section)
    const pack = pathname.match(/^\/studio\/playlist\/([^/]+)/)?.[1]
    if (pack) notePack(decodeURIComponent(pack), PACKS)
  }, [pathname])

  // what you play and queue
  useEffect(() => {
    // (whatever is queued already wasn't added just now)
    const seen = new Set(player.getState().queue.items.map(i => i.uid))
    const check = () => {
      const state = player.getState()
      const track = currentItem(state.queue)?.track
      if (state.status === 'playing' && track?.source === 'beat') {
        unlock('first-drop')
        if (new Date().getHours() < 5) unlock('night-owl')
      }
      for (const item of state.queue.items) {
        if (seen.has(item.uid)) continue
        seen.add(item.uid)
        if (item.from === 'user') noteQueued()
      }
    }
    return player.subscribe(check)
  }, [])

  // a save that's already got everything else (there used to be more)
  useEffect(() => checkComplete(), [])

  // pressing start on the title screen
  useEffect(() => {
    const onReveal = () => unlock('press-start')
    window.addEventListener(STAGE_REVEAL_EVENT, onReveal)
    return () => window.removeEventListener(STAGE_REVEAL_EVENT, onReveal)
  }, [])

  // reaching the end of a page
  useEffect(() => {
    if (pathname === '/') return
    let raf = 0
    const check = () => {
      raf = 0
      const room = document.documentElement.scrollHeight - window.innerHeight
      if (room > window.innerHeight * 0.6 && window.scrollY >= room - 32) {
        unlock('stage-clear')
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [pathname])

  // typed codes (and noting when you last did something, for sounds)
  useEffect(() => {
    let typed = ''
    const drop808 = () => {
      unlock('big-808')
      if (readSfx()) {
        const a = sfx()
        a?.boom(0)
        a?.clap(0)
      }
      window.dispatchEvent(new Event(LOGO_GLITCH_EVENT))
      if (reducedMotion()) return
      setDrop(d => d + 1)
      kick(1.4)
      const root = document.documentElement
      root.classList.add('stage-hit')
      window.setTimeout(() => root.classList.remove('stage-hit'), 340)
      const w = window.innerWidth
      const h = window.innerHeight
      ;[0, 120, 260].forEach((delay, i) =>
        window.setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent(HIT_EVENT, {
              detail: {
                x: i ? w * (0.2 + Math.random() * 0.6) : w / 2,
                y: i ? h * (0.2 + Math.random() * 0.4) : h / 2,
                power: 1.7 - i * 0.35
              }
            })
          )
        }, delay)
      )
    }
    const onKey = (e: KeyboardEvent) => {
      markGesture()
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1 || isTyping(e.target)) {
        return
      }
      typed = (typed + e.key.toLowerCase()).slice(-12)
      if (typed.endsWith('gameover')) {
        typed = ''
        gameOver()
      } else if (typed.endsWith('808')) {
        typed = ''
        drop808()
      }
    }
    const onPointer = () => markGesture()
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer, { capture: true, passive: true })
    window.addEventListener(DROP_EVENT, drop808)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer, { capture: true })
      window.removeEventListener(DROP_EVENT, drop808)
    }
  }, [])

  // the 808 flash goes away on its own
  useEffect(() => {
    if (!drop) return
    const t = window.setTimeout(() => setDrop(0), 900)
    return () => window.clearTimeout(t)
  }, [drop])

  return (
    <>
      <RhythmTap />
      <TrophyToast />
      <GameOverScreen />
      {drop > 0 && (
        <div
          key={drop}
          aria-hidden
          className='pointer-events-none fixed inset-0 z-[87] flex items-center justify-center overflow-hidden'
        >
          <span className='drop-808 text-split font-pixel text-[clamp(6rem,30vw,22rem)] leading-none font-bold text-theme'>
            808
          </span>
        </div>
      )}
      <Particles />
    </>
  )
}
