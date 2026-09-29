export const TRANSITION_EVENT = 'gameover:transition'

type Pushable = { push: (href: string) => void }

/**
 * Plays the "loading" pad sequence, then navigates. The overlay closes itself
 * once the new route renders (see TransitionOverlay). Skipped entirely for
 * people who prefer reduced motion.
 */
export function navigateWithTransition(
  router: Pushable,
  href: string,
  label = 'Loading'
) {
  if (typeof window === 'undefined') return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    router.push(href)
    return
  }
  window.dispatchEvent(new CustomEvent(TRANSITION_EVENT, { detail: { label } }))
  window.setTimeout(() => router.push(href), 620)
}
