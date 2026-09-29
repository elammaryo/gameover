'use client'

import { useEffect } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keeps Tab / Shift+Tab inside `ref` while `active` (for aria-modal dialogs,
 * so keyboard focus can't wander into the page underneath).
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean
) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const root = ref.current
      if (e.key !== 'Tab' || !root) return
      const items = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter(el => el.getClientRects().length > 0)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement as HTMLElement | null
      const inside = !!current && root.contains(current)
      if (e.shiftKey && (!inside || current === first)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (!inside || current === last)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [ref, active])
}
