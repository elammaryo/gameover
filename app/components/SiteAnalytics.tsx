'use client'

import { Analytics } from '@vercel/analytics/next'
import { isCounted } from '@/lib/visitor'

/**
 * Vercel Web Analytics, minus the browsers Omer has marked as his own
 * (lib/visitor.ts). A client component because beforeSend is a function, which
 * the server-rendered layout can't pass down.
 */
export function SiteAnalytics() {
  return <Analytics beforeSend={event => (isCounted() ? event : null)} />
}
