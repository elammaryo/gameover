/* Next.js runs this once per page load, after the HTML arrives and before React
   hydrates. Analytics starts here (lib/analytics.ts) so the ?me switch is
   settled before anything counts the visit. */

import { startAnalytics } from '@/lib/analytics'

startAnalytics()
