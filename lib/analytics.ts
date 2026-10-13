/* PostHog: where listeners come from (down to the city), what they're on,
   which links brought them, the same browser coming back over weeks, and
   recordings of how they use the studio. Vercel Web Analytics stays for the
   basics (app/components/SiteAnalytics.tsx). Omer asked for it on 2026-10-13,
   the same setup as his portfolio (omerelammary.com, src/posthog.ts).

   It reports to the same PostHog project as the portfolio ("Default project"
   on PostHog's US cloud, us.posthog.com/project/150186): PostHog's free plan
   allows one project per organization. The two sites are told apart by domain
   ($host, and the domain picker in Web analytics). Recordings are switched on
   in that project's settings, not here.

   Everything goes through gameover.studio/coin, which next.config.ts rewrites
   to PostHog's servers, so the browser only ever talks to the site itself and
   blockers that filter by domain let it through. A path that said "analytics",
   "tracking" or PostHog's documented "/ingest" would be on their lists; an
   arcade takes coins.

   It only runs on gameover.studio (not previews or localhost), loads as its own
   chunk once the page is idle, and never on a browser Omer has marked as his
   own (lib/visitor.ts). Started from instrumentation-client.ts.

   Recordings mask every input by PostHog's default. The LED backdrop, the G,
   the stage transition and the arcade's particles are canvases, which
   recordings don't capture: in a replay those areas are empty, and that isn't
   a fault. */

import { isCounted, visitorId } from '@/lib/visitor'

/** The project's public token: it can send events, not read them, so it's meant to ship. */
const KEY = 'phc_o6WVA5vK8SKsh4QiECzXDIyBJPb4xwKBZBFv6jLC8s9'

export function startAnalytics() {
  // Before React hydrates: ?me / ?notme leave the address bar now, and Vercel
  // Analytics' first page view already knows whether this browser counts.
  isCounted()
  if (!/(^|\.)gameover\.studio$/.test(location.hostname)) return
  const start = async () => {
    // First, so ?me is recorded even though this visit then stops here.
    const id = await visitorId()
    if (!isCounted()) return
    const { default: posthog } = await import('posthog-js')
    posthog.init(KEY, {
      api_host: '/coin',
      ui_host: 'https://us.posthog.com',
      // Includes counting client-side route changes as page views.
      defaults: '2026-08-30',
      // Every browser gets a profile in PostHog's People tab, listing all its
      // visits and their recordings. Still anonymous: the site never learns or
      // sends a name.
      person_profiles: 'always',
      // The server's ID, so Safari's weekly wipe doesn't split one listener
      // into many (app/api/hello/route.ts).
      ...(id ? { bootstrap: { distinctID: id } } : {}),
      // The site asks visitors nothing. Without this the SDK fetches its 100 KB
      // survey script on every visit even when the project has no surveys.
      disable_surveys: true
    })
  }
  const go = () => void start().catch(() => undefined)
  if ('requestIdleCallback' in window)
    requestIdleCallback(go, { timeout: 4000 })
  else setTimeout(go, 2000)
}
