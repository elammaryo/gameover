import type { Track } from '@/app/models/Track'

/* ---------------------------------------------------------------------------
   The play queue, as pure data. Everything that changes it goes through
   queueReducer, so the rules live in one place and can be tested alone.

   `items` is the whole play order: what's been played (before `index`),
   what's playing (`index`), and what's up next (after it). Every item has
   its own `uid`, so the same beat can sit in the queue twice and the UI can
   animate items as they move.

   Up next has two parts, like most music apps:
     user     tracks you added ("Play next" / "Add to queue"), played first
     context  the rest of the list you started from (a studio list, a pack,
              a playlist), in order, or shuffled
--------------------------------------------------------------------------- */

export type RepeatMode = 'off' | 'all' | 'one'

export type QueueItem = {
  uid: string
  track: Track
  from: 'context' | 'user'
}

export type QueueContext = {
  /** e.g. "studio", "pack:drill", "spotify:37i9..." */
  id: string
  /** shown as "Playing from …" */
  name: string
  /** the list in its own order (what shuffle restores) */
  tracks: Track[]
}

export type QueueState = {
  items: QueueItem[]
  index: number
  context: QueueContext | null
  shuffle: boolean
  repeat: RepeatMode
  /** which way the last change went, for motion: 1 next, -1 previous, 0 jump */
  direction: 1 | -1 | 0
  /** bumps whenever the current item is (re)started, even the same one */
  playId: number
}

export const EMPTY_QUEUE: QueueState = {
  items: [],
  index: -1,
  context: null,
  shuffle: false,
  repeat: 'off',
  direction: 0,
  playId: 0
}

let counter = 0
export const makeUid = () => `q${Date.now().toString(36)}${(counter++).toString(36)}`

const item = (track: Track, from: QueueItem['from']): QueueItem => ({
  uid: makeUid(),
  track,
  from
})

/** Fisher–Yates on a copy; `random` is injectable for tests. */
export function shuffleList<T>(list: T[], random: () => number = Math.random): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const currentItem = (q: QueueState): QueueItem | null =>
  q.index >= 0 && q.index < q.items.length ? q.items[q.index] : null

export const upcoming = (q: QueueState): QueueItem[] => q.items.slice(q.index + 1)

/** How many user-added items sit right after the current one. */
function userBlockEnd(q: QueueState): number {
  let i = q.index + 1
  while (i < q.items.length && q.items[i].from === 'user') i++
  return i
}

export type QueueAction =
  | {
      type: 'play'
      tracks: Track[]
      start: number
      context: Omit<QueueContext, 'tracks'> | null
      shuffle?: boolean
      random?: () => number
    }
  | { type: 'playNext'; track: Track }
  | { type: 'addToQueue'; track: Track }
  | { type: 'jump'; uid: string }
  | { type: 'next'; auto?: boolean; random?: () => number }
  | { type: 'prev' }
  | { type: 'restart' }
  | { type: 'remove'; uid: string }
  | { type: 'reorder'; uids: string[] }
  | { type: 'clearUser' }
  | { type: 'clearUpcoming' }
  | { type: 'setShuffle'; on: boolean; random?: () => number }
  | { type: 'setRepeat'; mode: RepeatMode }
  /** Spotify moved on by itself to this item (no restart) */
  | { type: 'sync'; uid: string }
  | { type: 'stop' }

export function queueReducer(q: QueueState, a: QueueAction): QueueState {
  switch (a.type) {
    case 'play': {
      const start = Math.max(0, Math.min(a.start, a.tracks.length - 1))
      const first = a.tracks[start]
      if (!first) return q
      // what you queued yourself survives starting something new
      const pendingUser = upcoming(q).filter(i => i.from === 'user')
      const shuffle = a.shuffle ?? q.shuffle
      const before = a.tracks.slice(0, start)
      const after = a.tracks.slice(start + 1)
      const rest = shuffle
        ? shuffleList([...after, ...before], a.random)
        : after
      const history = shuffle ? [] : before.map(t => item(t, 'context'))
      const items = [
        ...history,
        item(first, 'context'),
        ...pendingUser,
        ...rest.map(t => item(t, 'context'))
      ]
      return {
        ...q,
        items,
        index: history.length,
        context: a.context ? { ...a.context, tracks: a.tracks } : null,
        shuffle,
        direction: 0,
        playId: q.playId + 1
      }
    }

    case 'playNext': {
      const at = q.index + 1
      const items = [...q.items]
      items.splice(at, 0, item(a.track, 'user'))
      if (q.index < 0) {
        return { ...q, items, index: 0, direction: 0, playId: q.playId + 1 }
      }
      return { ...q, items }
    }

    case 'addToQueue': {
      const items = [...q.items]
      items.splice(userBlockEnd(q), 0, item(a.track, 'user'))
      if (q.index < 0) {
        return { ...q, items, index: 0, direction: 0, playId: q.playId + 1 }
      }
      return { ...q, items }
    }

    case 'jump': {
      const to = q.items.findIndex(i => i.uid === a.uid)
      if (to < 0) return q
      return {
        ...q,
        index: to,
        direction: to > q.index ? 1 : to < q.index ? -1 : 0,
        playId: q.playId + 1
      }
    }

    case 'next': {
      if (q.index < 0) return q
      // repeat-one only holds when the track ends on its own
      if (a.auto && q.repeat === 'one') {
        return { ...q, direction: 0, playId: q.playId + 1 }
      }
      if (q.index + 1 < q.items.length) {
        return { ...q, index: q.index + 1, direction: 1, playId: q.playId + 1 }
      }
      if (q.repeat !== 'off' && q.context?.tracks.length) {
        // go round again: rebuild the context (reshuffled if shuffling)
        const tracks = q.shuffle
          ? shuffleList(q.context.tracks, a.random)
          : q.context.tracks
        const items = tracks.map(t => item(t, 'context'))
        return { ...q, items, index: 0, direction: 1, playId: q.playId + 1 }
      }
      if (q.repeat !== 'off' && q.items.length) {
        return { ...q, index: 0, direction: 1, playId: q.playId + 1 }
      }
      return q // end of the queue: the player stops
    }

    case 'prev': {
      if (q.index > 0) {
        return { ...q, index: q.index - 1, direction: -1, playId: q.playId + 1 }
      }
      if (q.index === 0 && q.repeat === 'all' && q.items.length > 1) {
        return {
          ...q,
          index: q.items.length - 1,
          direction: -1,
          playId: q.playId + 1
        }
      }
      return { ...q, direction: 0, playId: q.playId + 1 } // restart
    }

    case 'restart':
      return { ...q, direction: 0, playId: q.playId + 1 }

    case 'remove': {
      const at = q.items.findIndex(i => i.uid === a.uid)
      if (at < 0 || at === q.index) return q
      const items = q.items.filter(i => i.uid !== a.uid)
      return { ...q, items, index: at < q.index ? q.index - 1 : q.index }
    }

    case 'reorder': {
      // `uids` is the new order of (some or all of) up next
      if (new Set(a.uids).size !== a.uids.length) return q
      const next = upcoming(q)
      const byUid = new Map(next.map(i => [i.uid, i]))
      const moved = a.uids.map(u => byUid.get(u)).filter((i): i is QueueItem => !!i)
      if (moved.length !== a.uids.length) return q
      const kept = new Set(a.uids)
      const tail = next.filter(i => !kept.has(i.uid))
      return {
        ...q,
        items: [...q.items.slice(0, q.index + 1), ...moved, ...tail]
      }
    }

    case 'clearUser':
      return {
        ...q,
        items: [
          ...q.items.slice(0, q.index + 1),
          ...upcoming(q).filter(i => i.from !== 'user')
        ]
      }

    case 'clearUpcoming':
      return { ...q, items: q.items.slice(0, q.index + 1) }

    case 'setShuffle': {
      if (a.on === q.shuffle) return q
      const next = upcoming(q)
      const user = next.filter(i => i.from === 'user')
      let context: QueueItem[]
      if (a.on) {
        context = shuffleList(
          next.filter(i => i.from === 'context'),
          a.random
        )
      } else if (q.context) {
        // back to the list's own order, carrying on after the last track
        // played from the list (the current one, unless you queued it)
        let anchor: QueueItem | null = null
        for (let i = q.index; i >= 0 && !anchor; i--) {
          if (q.items[i].from === 'context') anchor = q.items[i]
        }
        const pos = anchor
          ? q.context.tracks.findIndex(t => t.id === anchor.track.id)
          : -1
        context = q.context.tracks.slice(pos + 1).map(t => item(t, 'context'))
      } else {
        context = next.filter(i => i.from === 'context')
      }
      return {
        ...q,
        shuffle: a.on,
        items: [...q.items.slice(0, q.index + 1), ...user, ...context]
      }
    }

    case 'setRepeat':
      return { ...q, repeat: a.mode }

    case 'sync': {
      // Spotify moved on by itself: follow it (no restart)
      const at = q.items.findIndex(i => i.uid === a.uid)
      if (at < 0 || at === q.index) return q
      return { ...q, index: at, direction: at > q.index ? 1 : -1 }
    }

    case 'stop':
      return EMPTY_QUEUE

    default:
      return q
  }
}

export const nextRepeat = (mode: RepeatMode): RepeatMode =>
  mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off'
