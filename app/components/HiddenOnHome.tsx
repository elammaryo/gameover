'use client'

import { usePathname } from 'next/navigation'

/** The landing page is a single title screen: no footer under it. */
export function HiddenOnHome({ children }: { children: React.ReactNode }) {
  return usePathname() === '/' ? null : children
}
