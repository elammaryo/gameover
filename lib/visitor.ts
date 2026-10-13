/* Who gets counted (the same design as omerelammary.com's src/visitor.ts). The
   ID that ties a returning browser's visits together, and Omer's switch for
   keeping his own browsers out of the numbers, both live in cookies that the
   site's server sets (app/api/hello/route.ts says why Safari needs it that
   way). PostHog (lib/analytics.ts) and Vercel Analytics
   (app/components/SiteAnalytics.tsx) read them through here.

   Browser only, and nothing runs at import: client components are rendered on
   the server too, where there's no location or document. */

import { toast } from '@/lib/toast'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const read = (name: string) =>
  document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1]

let state: { flip: '' | 'me' | 'notme'; counted: boolean } | undefined

/**
 * gameover.studio/?me marks this browser as Omer's; /?notme undoes it. The
 * flag is read once and taken out of the address bar at once, so a link copied
 * from there can't switch anyone else off. The rest of the query stays as
 * written.
 */
function settle() {
  if (state) return state
  const parts = location.search.slice(1).split('&').filter(Boolean)
  const has = (key: string) => parts.some(part => part.split('=')[0] === key)
  const flip = has('me') ? 'me' : has('notme') ? 'notme' : ''
  if (flip) {
    const rest = parts
      .filter(part => !['me', 'notme'].includes(part.split('=')[0]))
      .join('&')
    history.replaceState(
      history.state,
      '',
      `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`
    )
  }
  state = { flip, counted: flip ? flip === 'notme' : read('go_me') !== '1' }
  return state
}

/** False on a browser Omer has marked as his own: nothing it does is counted. */
export const isCounted = () => typeof window !== 'undefined' && settle().counted

/**
 * This browser's visitor ID. On a later visit it's the cookie the server left;
 * on the first visit, or when the switch is flipped, it comes from the server,
 * which sets the cookies. If the server can't be reached there's none, and
 * PostHog makes an ID of its own.
 */
export async function visitorId(): Promise<string | undefined> {
  const { flip } = settle()
  const known = read('go_id')
  if (known && UUID.test(known) && !flip) return known
  try {
    const res = await fetch(`/api/hello${flip ? `?${flip}` : ''}`, {
      cache: 'no-store'
    })
    const { id } = (await res.json()) as { id?: string }
    // Only Omer ever sees this, right after flipping the switch.
    if (flip && res.ok)
      toast(
        flip === 'me'
          ? 'This browser won’t be counted'
          : 'This browser counts again',
        'Analytics on gameover.studio',
        'info',
        flip === 'me' ? 'off' : 'on'
      )
    return id && UUID.test(id) ? id : undefined
  } catch {
    return known && UUID.test(known) ? known : undefined
  }
}
