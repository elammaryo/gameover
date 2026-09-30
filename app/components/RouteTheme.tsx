'use client'

import { useEffect, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import { themeFor } from '@/lib/theme'

const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Keeps <html data-theme> in step with the route on client-side navigation
 * (the first paint is handled by THEME_SCRIPT in the root layout).
 */
export function RouteTheme() {
  const pathname = usePathname()
  useIsoLayoutEffect(() => {
    document.documentElement.dataset.theme = themeFor(pathname)
  }, [pathname])
  return null
}
