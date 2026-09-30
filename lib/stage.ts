import { THEMES } from './theme'

/* ---------------------------------------------------------------------------
   Stage transitions: the arcade-style "loading the next stage" sequence that
   plays when you leave the title screen for the studio (or Spotify). The
   overlay (app/components/StageTransition.tsx) runs the show and does the
   navigation itself, so it can hold the new page back until the drop.
--------------------------------------------------------------------------- */

export const STAGE_EVENT = 'gameover:stage'
/** fired the moment the new page is revealed (intro animations start) */
export const STAGE_REVEAL_EVENT = 'gameover:stage-reveal'
/** makes the chrome G glitch out (GIcon) */
export const LOGO_GLITCH_EVENT = 'gameover:logo-glitch'
/** sends a ripple through the LED backdrop: detail { x, y, power? } */
export const HIT_EVENT = 'gameover:hit'

export type StageId = 'studio' | 'spotify'

export type StageDetail = {
  href: string
  stage: StageId
  /** where the portal opens from (usually the button that was pressed) */
  x: number
  y: number
  /** optional status line, e.g. "Loading 42 beats" */
  meta?: string
}

export const STAGES: Record<
  StageId,
  { kicker: string; title: string; meta: string; colors: [string, string, string] }
> = {
  studio: {
    kicker: 'Stage 01',
    title: 'The sound lab',
    meta: 'Loading beats',
    colors: THEMES.studio.stops
  },
  spotify: {
    kicker: 'Bonus stage',
    title: 'The playlists',
    meta: 'Tuning in to Spotify',
    colors: THEMES.spotify.stops
  }
}

type Pushable = { push: (href: string) => void }

/**
 * Start the stage sequence from a click (or key press) on `from`.
 * People who prefer reduced motion go straight there.
 */
export function enterStage(
  router: Pushable,
  href: string,
  stage: StageId,
  from?: Element | null,
  meta?: string
) {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    router.push(href)
    return
  }
  const r = from?.getBoundingClientRect()
  const detail: StageDetail = {
    href,
    stage,
    x: r ? r.left + r.width / 2 : window.innerWidth / 2,
    y: r ? r.top + r.height / 2 : window.innerHeight / 2,
    meta
  }
  const handled = !window.dispatchEvent(
    new CustomEvent(STAGE_EVENT, { detail, cancelable: true })
  )
  // no StageTransition listening (shouldn't happen): just go
  if (!handled) router.push(href)
}

/** Is a stage sequence covering the page right now? */
export const stageActive = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.stage === 'on'
