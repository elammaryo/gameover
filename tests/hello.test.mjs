// The visitor ID route (app/api/hello/route.ts), called the way Next.js calls
// it: a web Request in, a Response out. Run with: npm test
import assert from 'node:assert/strict'
import { GET } from '../app/api/hello/route.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const YEAR = 'Max-Age=34560000'
const call = async (path, { host = 'gameover.studio', cookie } = {}) => {
  const headers = { host }
  if (cookie) headers.cookie = cookie
  const res = GET(new Request(`https://${host}${path}`, { headers }))
  return { res, body: await res.json(), cookies: res.headers.getSetCookie() }
}
const id = '0f8fad5b-d9cb-469f-a165-70867728950e'

// a first visit gets a fresh random ID, for 400 days, shared with www
let r = await call('/api/hello')
assert.equal(r.res.status, 200)
assert.match(r.body.id, UUID)
assert.deepEqual(r.cookies, [
  `go_id=${r.body.id}; Path=/; ${YEAR}; SameSite=Lax; Secure; Domain=gameover.studio`
])
assert.equal(r.res.headers.get('cache-control'), 'no-store')
// two first visits never share one
assert.notEqual((await call('/api/hello')).body.id, (await call('/api/hello')).body.id)
// a browser that has one keeps it, and the cookie is renewed
r = await call('/api/hello', { cookie: `spotify_logged_in=true; go_id=${id}` })
assert.equal(r.body.id, id)
assert.ok(r.cookies[0].startsWith(`go_id=${id};`))
// junk is replaced, never passed on
for (const junk of ['hello', 'DROP TABLE', id.toUpperCase(), ''])
  assert.notEqual((await call('/api/hello', { cookie: `go_id=${junk}` })).body.id, junk)
// www shares the domain; a preview host keeps its cookie to itself
assert.ok((await call('/api/hello', { host: 'www.gameover.studio' })).cookies[0].endsWith('; Domain=gameover.studio'))
assert.ok(!(await call('/api/hello', { host: 'gameover-git-x.vercel.app' })).cookies[0].includes('Domain='))
// ?me sets the switch for 400 days, ?notme clears it; both keep the ID
r = await call('/api/hello?me', { cookie: `go_id=${id}` })
assert.equal(r.body.id, id)
assert.equal(r.cookies[1], `go_me=1; Path=/; ${YEAR}; SameSite=Lax; Secure; Domain=gameover.studio`)
r = await call('/api/hello?notme', { cookie: `go_id=${id}; go_me=1` })
assert.equal(r.cookies[1], 'go_me=; Path=/; Max-Age=0; SameSite=Lax; Secure; Domain=gameover.studio')
assert.equal((await call('/api/hello', { cookie: `go_id=${id}; go_me=1` })).cookies.length, 1)

console.log('hello: all passed')
