'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { isActive, player } from '../../providers/player'
import { GAME_OVER_EVENT, burst, kick, markGesture, reducedMotion } from '@/lib/arcade'
import { currentItem } from '@/lib/queue'
import { readSfx, sfx } from '@/lib/sfx'
import { LOGO_GLITCH_EVENT, stageActive } from '@/lib/stage'
import { playerAudio, restoreTape, tapeStart, tapeStop } from '@/lib/tape'
import { unlock } from '@/lib/trophies'
import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------------------
   GAME OVER. Type "gameover" (or tap the giant GAMEOVER at the bottom of a
   page three times) and the screen switches off like an old CRT, the beat
   winds down like a tape losing power, GAME OVER drops in and the
   CONTINUE? clock counts down. Press any key (or tap) to put a coin in:
   the screen comes back on and the beat winds back up.

     off      the lids close to a line, the line to a dot       ~0.8s
     title    GAME OVER drops in (the jingle plays)             ~1.25s
     count    CONTINUE? 9 … 0                                   up to 10s
     insert   INSERT COIN (nobody pressed anything)             1.7s
     resume   CONTINUE! (a coin went in)                        0.65s
     on       the dot opens to a line, the lids open            0.7s
--------------------------------------------------------------------------- */

type Phase = 'off' | 'title' | 'count' | 'insert' | 'resume' | 'on'

const OFF_MS = 820
const TITLE_MS = 1250
const INSERT_MS = 1700
const RESUME_MS = 650
const ON_MS = 720
/** keys typed straight after "gameover" shouldn't count as a coin */
const GUARD_MS = 900

type Run = {
  at: number
  /** music to bring back after */
  resume: 'beat' | 'spotify' | null
  reduced: boolean
  focus: HTMLElement | null
}

const LETTERS = ['G', 'A', 'M', 'E', ' ', 'O', 'V', 'E', 'R']

/** run `fn` once the element has paused (or soon, whatever happens) */
function whenPaused(a: HTMLAudioElement | null, fn: () => void) {
  if (!a || a.paused) {
    fn()
    return
  }
  let done = false
  const once = () => {
    if (done) return
    done = true
    a.removeEventListener('pause', once)
    window.clearTimeout(timer)
    fn()
  }
  a.addEventListener('pause', once)
  const timer = window.setTimeout(once, 500)
}

export function GameOverScreen() {
  const [run, setRun] = useState<Run | null>(null)
  const [phase, setPhase] = useState<Phase>('off')
  const [count, setCount] = useState(9)
  const box = useRef<HTMLDivElement>(null)
  const prompt = useRef<HTMLButtonElement>(null)
  const runRef = useRef<Run | null>(null)
  const phaseRef = useRef<Phase>('off')
  const coin = useRef(false)

  const go = (next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }

  const start = () => {
    if (runRef.current || stageActive()) return
    const reduced = reducedMotion()
    const state = player.getState()
    const source = currentItem(state.queue)?.track.source ?? null
    const playing = isActive(state.status) && !!source
    const next: Run = {
      at: performance.now(),
      resume: playing ? (source as 'beat' | 'spotify') : null,
      reduced,
      focus: document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
    runRef.current = next
    coin.current = false

    // the music goes down with the screen
    if (playing && source === 'beat') {
      void tapeStop().then(end => {
        // a coin already went in (or it's all over): leave the music be
        if (end === 'replaced' || coin.current || runRef.current !== next) return
        const a = playerAudio()
        player.setPlaying(false)
        // back to normal speed once it has actually stopped (the pause
        // fades out first), unless a coin went in meanwhile
        whenPaused(a, () => {
          if (!coin.current) restoreTape(a)
        })
      })
    } else if (playing) {
      player.setPlaying(false)
    }

    // (these sounds, and the countdown's, all answer the key press that
    // started it)
    if (readSfx()) {
      const a = sfx()
      if (!playing && !reduced) a?.powerDown(0)
      a?.gameOver(reduced ? 0.1 : (OFF_MS + 120) / 1000)
    }
    window.dispatchEvent(new Event(LOGO_GLITCH_EVENT))

    setCount(9)
    setRun(next)
    go(reduced ? 'count' : 'off')
  }

  const finish = () => {
    const current = runRef.current
    runRef.current = null
    setRun(null)
    unlock('continue')
    if (current?.focus?.isConnected) current.focus.focus({ preventScroll: true })
  }

  /** a coin: from a key press or a tap (so the music may start again) */
  const insertCoin = (quick = false) => {
    const current = runRef.current
    if (!current || coin.current) return
    if (performance.now() - current.at < GUARD_MS) return
    if (!['title', 'count', 'insert'].includes(phaseRef.current)) return
    coin.current = true
    markGesture()
    if (readSfx()) sfx()?.coin(0)

    // back up to speed, straight from the key press (so it's allowed to play)
    if (current.resume === 'beat') {
      const a = playerAudio()
      if (a) {
        a.preservesPitch = false
        a.playbackRate = 0.5
      }
      player.setPlaying(true)
      void tapeStart(quick || current.reduced ? 380 : RESUME_MS + 400)
    } else if (current.resume === 'spotify') {
      player.setPlaying(true)
    }

    if (current.reduced) {
      finish()
      return
    }
    if (quick) {
      go('on')
      return
    }
    burst({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.62,
      count: 16,
      kind: 'coins',
      power: 1.15
    })
    go('resume')
  }

  const onStart = useEffectEvent(start)
  const onFinish = useEffectEvent(finish)
  const onCoin = useEffectEvent(insertCoin)
  const onPhase = useEffectEvent(go)

  useEffect(() => {
    const listener = () => onStart()
    window.addEventListener(GAME_OVER_EVENT, listener)
    return () => window.removeEventListener(GAME_OVER_EVENT, listener)
  }, [])

  // the timeline
  useEffect(() => {
    if (!run) return
    if (run.reduced) {
      // no switching off and on: nobody pressed anything, so just go
      if (phase !== 'insert') return
      const t = window.setTimeout(() => onFinish(), INSERT_MS)
      return () => window.clearTimeout(t)
    }
    let timer = 0
    if (phase === 'off') timer = window.setTimeout(() => onPhase('title'), OFF_MS)
    else if (phase === 'title') timer = window.setTimeout(() => onPhase('count'), TITLE_MS)
    else if (phase === 'insert') timer = window.setTimeout(() => onPhase('on'), INSERT_MS)
    else if (phase === 'resume') timer = window.setTimeout(() => onPhase('on'), RESUME_MS)
    else if (phase === 'on') {
      // the picture's back: the page takes the hit
      const root = document.documentElement
      const hit = window.setTimeout(() => {
        root.classList.add('stage-hit')
        kick(1)
      }, 240)
      const unhit = window.setTimeout(() => root.classList.remove('stage-hit'), 600)
      timer = window.setTimeout(() => onFinish(), ON_MS)
      return () => {
        window.clearTimeout(hit)
        window.clearTimeout(unhit)
        window.clearTimeout(timer)
        root.classList.remove('stage-hit')
      }
    }
    return () => window.clearTimeout(timer)
  }, [run, phase])

  // CONTINUE? 9 … 0
  useEffect(() => {
    if (!run || phase !== 'count') return
    let n = 9
    const id = window.setInterval(() => {
      n -= 1
      if (n < 0) {
        window.clearInterval(id)
        onPhase('insert')
        return
      }
      setCount(n)
      if (readSfx() && document.visibilityState === 'visible') {
        sfx()?.blip(0, n === 0 ? 523 : 880)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [run, phase])

  // the prompt is a real button, so assistive tech can find and press it
  useEffect(() => {
    if (phase === 'title' || phase === 'count') {
      prompt.current?.focus({ preventScroll: true })
    }
  }, [phase])

  // every key is ours while it's up (Space mustn't reach the player)
  useEffect(() => {
    if (!run) return
    // (the prompt takes focus once it's there)
    if (!box.current?.contains(document.activeElement)) {
      box.current?.focus({ preventScroll: true })
    }
    const onKey = (e: KeyboardEvent) => {
      // leave browser and system shortcuts alone (reload, back, ...)
      if (e.metaKey || e.ctrlKey || e.altKey || /^F\d{1,2}$/.test(e.key)) return
      e.preventDefault()
      e.stopImmediatePropagation()
      if (e.repeat || ['Shift', 'Alt', 'Control', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return
      }
      onCoin(e.key === 'Escape')
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [run])

  // if something goes wrong mid-way, the tape still ends up at normal speed
  useEffect(() => () => restoreTape(), [])

  if (!run) return null

  const dark = phase === 'title' || phase === 'count' || phase === 'insert' || phase === 'resume'
  const shutters = phase === 'off' || phase === 'on'

  return (
    <div
      ref={box}
      role='dialog'
      aria-modal='true'
      aria-label='Game over'
      tabIndex={-1}
      // a coin goes in on the click, not the press: by then the tap is
      // over, so it can't land on the page underneath as the screen goes
      onPointerDown={e => e.preventDefault()}
      onClick={() => insertCoin(false)}
      className={cn(
        'fixed inset-0 z-[9998] overflow-hidden outline-none select-none',
        phase === 'off' && 'crt-off',
        phase === 'on' && 'crt-on pointer-events-none',
        dark && 'cursor-pointer'
      )}
    >
      {shutters && (
        <>
          <div aria-hidden className='crt-lid' data-edge='top' />
          <div aria-hidden className='crt-lid' data-edge='bottom' />
          <div aria-hidden className='crt-line' />
        </>
      )}

      {dark && (
        <div className='absolute inset-0 bg-ink-950'>
          <div aria-hidden className='stage-scan pointer-events-none absolute inset-0' />
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_42%,rgb(255_52_72/0.16),transparent_70%)]'
          />
          <div className='relative flex h-full flex-col items-center justify-center px-6 text-center'>
            <p
              aria-hidden
              className='text-split font-pixel text-[clamp(3.4rem,12.5vw,8.75rem)] leading-[0.95] font-bold text-signal'
            >
              {LETTERS.map((letter, i) =>
                letter === ' ' ? (
                  <span key={i} className='inline-block w-[0.45em] max-sm:block max-sm:h-0' />
                ) : (
                  <span
                    key={i}
                    className={cn(!run.reduced && 'go-letter')}
                    style={{ '--i': i } as React.CSSProperties}
                  >
                    {letter}
                  </span>
                )
              )}
            </p>

            <div className='mt-10 flex min-h-[9.5rem] flex-col items-center sm:mt-12'>
              {phase === 'count' && (
                <>
                  <p className='go-fade font-pixel text-base tracking-[0.3em] text-bone uppercase sm:text-lg'>
                    Continue?
                  </p>
                  <p
                    key={count}
                    aria-hidden
                    className={cn(
                      'tabular mt-3 font-pixel text-[4.5rem] leading-none text-warn sm:text-[5.5rem]',
                      !run.reduced && 'go-tick'
                    )}
                  >
                    {count}
                  </p>
                </>
              )}
              {phase === 'insert' && (
                <p className='mt-8 animate-blink font-pixel text-lg tracking-[0.3em] text-theme uppercase sm:text-xl'>
                  Insert coin
                </p>
              )}
              {phase === 'resume' && (
                <p className='pop-in mt-8 font-pixel text-2xl tracking-[0.2em] text-live uppercase sm:text-3xl'>
                  Continue!
                </p>
              )}
              {(phase === 'title' || phase === 'count') && (
                // (waits for the letters to land; the screen's click puts
                // the coin in, so this needs no handler of its own)
                <span className='go-fade mt-7 [animation-delay:1s]'>
                  <button
                    ref={prompt}
                    type='button'
                    className='animate-blink rounded-md px-2 py-1 font-pixel text-[11px] tracking-[0.3em] text-bone-muted uppercase outline-none focus-visible:ring-1 focus-visible:ring-white/20'
                  >
                    <span className='pointer-coarse:hidden'>Press any key</span>
                    <span className='hidden pointer-coarse:inline'>Tap to continue</span>
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <p className='sr-only' aria-live='assertive'>
        {phase === 'count' || phase === 'title'
          ? 'Game over. Continue? Press any key, or tap the screen.'
          : phase === 'resume'
            ? 'Continue!'
            : ''}
      </p>
    </div>
  )
}
