/* ---------------------------------------------------------------------------
   Tape stop / tape start: the beat winds down (or back up) like a reel
   losing power, by sliding the player's playback rate with pitch following
   it. Used by the GAME OVER screen. The rate always goes back to normal at
   the end, and straight away if the track changes underneath.
--------------------------------------------------------------------------- */

type PitchAudio = HTMLAudioElement & {
  webkitPreservesPitch?: boolean
  mozPreservesPitch?: boolean
}

/** the beat player's element (app/providers/beatEngine.ts) */
export const playerAudio = () =>
  typeof document === 'undefined'
    ? null
    : document.querySelector<PitchAudio>('audio[data-player-audio]')

function lockPitch(a: PitchAudio, on: boolean) {
  a.preservesPitch = on
  a.webkitPreservesPitch = on
  a.mozPreservesPitch = on
}

/** back to normal speed and pitch */
export function restoreTape(a = playerAudio()) {
  if (!a) return
  a.playbackRate = 1
  lockPitch(a, true)
}

/**
 * How a slide ended: it got there, a newer slide took over, or the element
 * got a new source / errored underneath it (then it's back to normal).
 */
export type SlideEnd = 'done' | 'replaced' | 'interrupted'

/** the slide in progress, if any: calling it hands over to a newer one */
let active: (() => void) | null = null

/**
 * Slide the rate from `from` to `to` over `ms`. Only one runs at a time (a
 * new one replaces the old). Timer-driven, so it finishes even in a
 * background tab.
 */
function slide(from: number, to: number, ms: number, ease: (k: number) => number) {
  const a = playerAudio()
  if (!a) return Promise.resolve<SlideEnd>('interrupted')
  active?.()
  return new Promise<SlideEnd>(resolve => {
    lockPitch(a, false)
    a.playbackRate = from
    const t0 = performance.now()
    let done = false
    const finish = (end: SlideEnd) => {
      if (done) return
      done = true
      if (active === replace) active = null
      window.clearInterval(timer)
      a.removeEventListener('emptied', bail)
      a.removeEventListener('error', bail)
      if (end === 'interrupted') restoreTape(a)
      resolve(end)
    }
    const bail = () => finish('interrupted')
    // the newer slide owns the rate from here
    const replace = () => finish('replaced')
    active = replace
    const timer = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms)
      a.playbackRate = from + (to - from) * ease(k)
      if (k >= 1) finish('done')
    }, 16)
    a.addEventListener('emptied', bail)
    a.addEventListener('error', bail)
  })
}

/** wind down to a crawl (the caller pauses it, then calls restoreTape) */
export const tapeStop = (ms = 720) => slide(1, 0.42, ms, k => k * k)

/** wind back up to speed from a crawl, then lock the pitch again */
export async function tapeStart(ms = 520) {
  const end = await slide(0.5, 1, ms, k => 1 - (1 - k) * (1 - k))
  // (a newer slide owns the rate now)
  if (end !== 'replaced') restoreTape()
  return end
}
