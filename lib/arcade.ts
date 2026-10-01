/* ---------------------------------------------------------------------------
   The arcade layer: small game touches that answer what you do. Trophies
   for finding things, a rhythm game hidden in the empty space of every
   page, a GAME OVER screen, pixel bursts. Everything talks through window
   events, so anything can set one off without importing what draws it
   (app/components/arcade).
--------------------------------------------------------------------------- */

/** pixels burst out from a point: detail BurstDetail */
export const BURST_EVENT = 'gameover:burst'
/** the LED wall pumps as if a kick drum hit: detail { power } */
export const KICK_EVENT = 'gameover:kick'
/** the GAME OVER screen: detail { x, y } (where it came from) */
export const GAME_OVER_EVENT = 'gameover:game-over'
/** the 808 drop (typing "808", or searching for it) */
export const DROP_EVENT = 'gameover:drop'

export type BurstDetail = {
  x: number
  y: number
  count?: number
  /** defaults to the page's accent colours */
  colors?: string[]
  /** how far they fly (1 = a small pop) */
  power?: number
  /** coins are bigger and gold, and spin */
  kind?: 'pixels' | 'coins'
}

const send = (name: string, detail?: unknown) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

export const burst = (detail: BurstDetail) => send(BURST_EVENT, detail)
export const kick = (power = 1) => send(KICK_EVENT, { power })
export const gameOver = (x?: number, y?: number) => send(GAME_OVER_EVENT, { x, y })
export const drop = () => send(DROP_EVENT)

/**
 * The typed codes, for text fields (where typing is just typing): a field
 * whose whole value is a code sets it off. Phones have no other keyboard.
 */
export function codeFromText(value: string): 'gameover' | '808' | null {
  const text = value.trim().toLowerCase().replace(/\s+/g, '')
  if (text === 'gameover') return 'gameover'
  if (text === '808') return '808'
  return null
}

export const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

/* Sounds only ever answer a click or a key press. Things that happen a
   moment after one (a trophy for the page you just opened) may still
   chime; things that happen on their own stay quiet. */
let gestureAt = -Infinity
export const markGesture = () => {
  gestureAt = performance.now()
}
export const recentGesture = (ms = 2500) => performance.now() - gestureAt < ms

/** the page's accent colours, as it shows them right now */
export function themeColors(): string[] {
  if (typeof window === 'undefined') return []
  const style = getComputedStyle(document.documentElement)
  return ['--color-theme', '--color-theme-2', '--color-theme-3']
    .map(name => style.getPropertyValue(name).trim())
    .filter(Boolean)
}
