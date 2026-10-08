// Queue rules (lib/queue.ts). Run with: npm test
// Plain JS; Node strips the types from the imported TypeScript module.
import assert from 'node:assert/strict'
import { EMPTY_QUEUE, queueReducer as R, currentItem, upcoming } from '../lib/queue.ts'

const T = id => ({ id, title: id, source: 'beat', audioUrl: '' })
const list = ['a', 'b', 'c', 'd', 'e'].map(T)
const ids = q => q.items.map(i => i.track.id).join('')
const cur = q => currentItem(q)?.track.id
const up = q => upcoming(q).map(i => i.track.id).join('')
let seed = 1
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

// play from the middle keeps history
let q = R(EMPTY_QUEUE, { type: 'play', tracks: list, start: 2, context: { id: 'x', name: 'X' } })
assert.equal(ids(q), 'abcde'); assert.equal(cur(q), 'c'); assert.equal(up(q), 'de')
// next / prev
q = R(q, { type: 'next' }); assert.equal(cur(q), 'd'); assert.equal(q.direction, 1)
q = R(q, { type: 'prev' }); assert.equal(cur(q), 'c'); assert.equal(q.direction, -1)
// play next goes right after current, add to queue after the user block
q = R(q, { type: 'playNext', track: T('p') })
q = R(q, { type: 'addToQueue', track: T('q') })
q = R(q, { type: 'addToQueue', track: T('r') })
q = R(q, { type: 'playNext', track: T('s') })
assert.equal(up(q), 'spqrde')
// reorder up next
const [s, p, qq, r] = upcoming(q)
q = R(q, { type: 'reorder', uids: [r.uid, s.uid, p.uid, qq.uid] })
assert.equal(up(q), 'rspqde')
// remove, clear user
q = R(q, { type: 'remove', uid: s.uid }); assert.equal(up(q), 'rpqde')
q = R(q, { type: 'clearUser' }); assert.equal(up(q), 'de')
// cannot remove the current item
const before = q; q = R(q, { type: 'remove', uid: currentItem(q).uid }); assert.equal(q, before)
// end of queue: repeat off returns the same state (player stops)
q = R(q, { type: 'next' }); q = R(q, { type: 'next' }); assert.equal(cur(q), 'e')
assert.equal(R(q, { type: 'next' }), q)
// repeat all wraps
q = R(q, { type: 'setRepeat', mode: 'all' }); q = R(q, { type: 'next' }); assert.equal(cur(q), 'a'); assert.equal(ids(q), 'abcde')
// repeat one holds only when the track ends by itself
q = R(q, { type: 'setRepeat', mode: 'one' })
const pid = q.playId; q = R(q, { type: 'next', auto: true }); assert.equal(cur(q), 'a'); assert.equal(q.playId, pid + 1)
q = R(q, { type: 'next' }); assert.equal(cur(q), 'b')
// shuffle keeps user items first and restores order when turned off
q = R(q, { type: 'setRepeat', mode: 'off' })
q = R(q, { type: 'addToQueue', track: T('u') })
q = R(q, { type: 'setShuffle', on: true, random: rnd })
// (the whole list besides what's playing, from before it too)
assert.equal(upcoming(q)[0].track.id, 'u'); assert.equal(up(q).length, 5)
assert.deepEqual([...up(q).slice(1)].sort().join(''), 'acde')
q = R(q, { type: 'setShuffle', on: false }); assert.equal(up(q), 'ucde')
// starting something new keeps what you queued
q = R(q, { type: 'play', tracks: ['x', 'y'].map(T), start: 0, context: { id: 'n', name: 'N' } })
assert.equal(cur(q), 'x'); assert.equal(up(q), 'uy')
// jump
const y = upcoming(q)[1]; q = R(q, { type: 'jump', uid: y.uid }); assert.equal(cur(q), 'y'); assert.equal(q.direction, 1)
// sync follows spotify to that exact item (duplicates: no jumping ahead)
q = R(EMPTY_QUEUE, { type: 'play', tracks: [...list, T('a')], start: 2, context: null })
const firstA = q.items[0]
q = R(q, { type: 'sync', uid: firstA.uid }); assert.equal(q.index, 0); assert.equal(q.direction, -1)
q = R(q, { type: 'sync', uid: q.items[3].uid }); assert.equal(cur(q), 'd'); assert.equal(q.direction, 1)
assert.equal(R(q, { type: 'sync', uid: 'nope' }), q)
// reorder rejects duplicate uids
{
  const u = upcoming(q)
  assert.equal(R(q, { type: 'reorder', uids: [u[0].uid, u[0].uid] }), q)
}
// shuffle off while a queued track plays: carry on after the last track
// played from the list (not after the queued track's copy in the list)
q = R(EMPTY_QUEUE, { type: 'play', tracks: list, start: 1, context: { id: 'x', name: 'X' } })
q = R(q, { type: 'playNext', track: T('d') }) // queue a copy of d
q = R(q, { type: 'setShuffle', on: true, random: rnd })
q = R(q, { type: 'next' }) // now playing the queued d
assert.equal(cur(q), 'd'); assert.equal(currentItem(q).from, 'user')
q = R(q, { type: 'setShuffle', on: false })
assert.equal(up(q), 'cde')
// add to queue with nothing playing starts it
q = R(EMPTY_QUEUE, { type: 'addToQueue', track: T('z') }); assert.equal(cur(q), 'z'); assert.equal(q.playId, 1)
// play with shuffle puts the chosen track first
q = R(EMPTY_QUEUE, { type: 'play', tracks: list, start: 3, context: null, shuffle: true, random: rnd })
assert.equal(cur(q), 'd'); assert.equal(q.index, 0); assert.equal([...up(q)].sort().join(''), 'abce')
// shuffle on after starting from the last track: the rest of the list is up next
{
  let s = R(EMPTY_QUEUE, { type: 'play', tracks: list, start: 4, context: { id: 'x', name: 'X' } })
  assert.equal(up(s), '')
  const history = s.items.slice(0, s.index).map(i => i.uid).join()
  s = R(s, { type: 'setShuffle', on: true, random: rnd })
  assert.equal(cur(s), 'e'); assert.equal([...up(s)].sort().join(''), 'abcd')
  // "previous" still goes back through the list as it was
  assert.equal(s.items.slice(0, s.index).map(i => i.uid).join(), history)
  // no item twice
  assert.equal(new Set(s.items.map(i => i.uid)).size, s.items.length)
  s = R(s, { type: 'setShuffle', on: false }); assert.equal(up(s), '')
}
// from the middle: what was up next keeps its items (rows move, not reappear)
{
  let s = R(EMPTY_QUEUE, { type: 'play', tracks: list, start: 2, context: { id: 'x', name: 'X' } })
  const after = new Set(upcoming(s).map(i => i.uid))
  s = R(s, { type: 'addToQueue', track: T('u') })
  s = R(s, { type: 'setShuffle', on: true, random: rnd })
  assert.equal(up(s)[0], 'u'); assert.equal([...up(s).slice(1)].sort().join(''), 'abde')
  assert.equal(upcoming(s).filter(i => after.has(i.uid)).length, 2)
  assert.equal(new Set(s.items.map(i => i.uid)).size, s.items.length)
}
// without a context: everything else that came from the list
{
  let s = R(EMPTY_QUEUE, { type: 'play', tracks: list, start: 2, context: null })
  s = R(s, { type: 'setShuffle', on: true, random: rnd })
  assert.equal(cur(s), 'c'); assert.equal([...up(s)].sort().join(''), 'abde')
  assert.equal(new Set(s.items.map(i => i.uid)).size, s.items.length)
}
// a queued track playing: the list's place is the last list track played
{
  let s = R(EMPTY_QUEUE, { type: 'play', tracks: list, start: 1, context: { id: 'x', name: 'X' } })
  s = R(s, { type: 'playNext', track: T('z') })
  s = R(s, { type: 'next' }); assert.equal(cur(s), 'z')
  s = R(s, { type: 'setShuffle', on: true, random: rnd })
  assert.equal([...up(s)].sort().join(''), 'acde')
}
console.log('queue tests passed')
