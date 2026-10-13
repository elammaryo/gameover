/* The ID that PostHog recognises a returning browser by (lib/visitor.ts),
   handed out by the site's own server. The same design as Omer's portfolio
   (omerelammary.com, api/hello.js); he asked for it here on 2026-10-13.

   Why a server hands it out: Safari deletes everything a page's script stores,
   cookies included, after seven days of Safari use in which the visitor doesn't
   interact with the site, so an ID that PostHog keeps for itself makes an
   iPhone that comes back after two weeks look like a new visitor. A cookie set
   in an HTTP response from the site itself isn't script storage, and Safari
   keeps it for as long as it asks. Fingerprinting was the other way, and was
   ruled out: Safari 26 is built to defeat it, and it's covert tracking. The ID
   is random and says nothing about anyone.

   The page calls this on a browser's first visit, and when Omer flips his
   switch (?me keeps that browser out of the counts, ?notme lets it back in);
   every other visit reads the cookie itself. The switch is a server-set cookie
   too, for the same Safari reason. Plain web APIs only, so
   tests/hello.test.mjs can call it without Next.js. */

/** Browsers cap a cookie's life at about 400 days; asking for more buys nothing. */
const LIFETIME = 400 * 24 * 60 * 60
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function readCookie(header: string | null, name: string) {
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name)
      return part.slice(i + 1).trim()
  }
  return ''
}

function cookie(name: string, value: string, maxAge: number, host: string) {
  // On gameover.studio it's shared with www; on any other host (a preview
  // deployment) it stays with that host, since a browser drops a cookie that
  // names a domain the page isn't on. Not HttpOnly: the page reads the ID
  // itself on every later visit.
  const domain = /(^|\.)gameover\.studio$/.test(host)
    ? '; Domain=gameover.studio'
    : ''
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure${domain}`
}

export function GET(request: Request) {
  const url = new URL(request.url)
  const host = (request.headers.get('host') ?? url.hostname)
    .split(':')[0]
    .toLowerCase()
  const known = readCookie(request.headers.get('cookie'), 'go_id')
  // Anything that isn't one of ours is replaced: a hand-edited cookie can't put
  // arbitrary text into PostHog as somebody's ID.
  const id = UUID.test(known) ? known : crypto.randomUUID()
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  headers.append('Set-Cookie', cookie('go_id', id, LIFETIME, host))
  if (url.searchParams.has('me'))
    headers.append('Set-Cookie', cookie('go_me', '1', LIFETIME, host))
  else if (url.searchParams.has('notme'))
    headers.append('Set-Cookie', cookie('go_me', '', 0, host))
  return Response.json({ id }, { headers })
}
