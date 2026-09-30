/* Small confirmations near the player ("Added to queue", "Skipped …").
   Anything can raise one; app/components/PlayerToasts.tsx shows them. */

export const TOAST_EVENT = 'gameover:toast'

export type ToastDetail = {
  text: string
  /** a short secondary line, e.g. the track title */
  detail?: string
  tone?: 'info' | 'warn'
}

export function toast(text: string, detail?: string, tone: ToastDetail['tone'] = 'info') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { text, detail, tone } })
  )
}
