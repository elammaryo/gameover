/* ---------------------------------------------------------------------------
   Trophies: achievements for finding your way around (and for finding the
   things that aren't signposted). Kept on this device only, like a save
   file; the trophy case on the About page shows them, and a toast pops
   (app/components/arcade/TrophyToast.tsx) when one unlocks.
--------------------------------------------------------------------------- */

export type TrophyId =
  | 'press-start'
  | 'first-drop'
  | 'stage-clear'
  | 'explorer'
  | 'crate-digger'
  | 'setlist'
  | 'night-owl'
  | 'on-beat'
  | 'combo'
  | 'continue'
  | 'big-808'
  | 'completionist'

export type Trophy = {
  id: TrophyId
  name: string
  /** what you did (shown once it's unlocked) */
  done: string
  /** how to get it (shown while it's locked) */
  hint: string
  points: number
  /** easter eggs: the name stays hidden until it's found */
  secret?: boolean
}

export const TROPHIES: Trophy[] = [
  {
    id: 'press-start',
    name: 'Press Start',
    done: 'Entered the studio from the title screen',
    hint: 'Press start on the title screen',
    points: 10
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    done: 'Played your first beat',
    hint: 'Play any beat',
    points: 10
  },
  {
    id: 'stage-clear',
    name: 'Stage Clear',
    done: 'Made it to the end of a page',
    hint: 'Scroll all the way to the bottom of a page',
    points: 10
  },
  {
    id: 'explorer',
    name: 'World Map',
    done: 'Visited every stage: Studio, Spotify, Tech and About',
    hint: 'Visit the Studio, Spotify, Tech and About pages',
    points: 20
  },
  {
    id: 'crate-digger',
    name: 'Crate Digger',
    done: 'Opened every beat pack',
    hint: 'Open every pack in the studio',
    points: 20
  },
  {
    id: 'setlist',
    name: 'Setlist',
    done: 'Queued up three tracks',
    hint: 'Add three tracks to your queue',
    points: 15
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    done: 'Played a beat between midnight and 5am',
    hint: 'Some beats hit different after midnight',
    points: 20
  },
  {
    id: 'on-beat',
    name: 'On Beat',
    done: 'Tapped along to a beat, perfectly',
    hint: 'While a beat plays, tap along on an empty part of the page',
    points: 20,
    secret: true
  },
  {
    id: 'combo',
    name: 'Combo ×16',
    done: 'Kept the beat for sixteen taps in a row',
    hint: 'Keep tapping along without missing',
    points: 30,
    secret: true
  },
  {
    id: 'continue',
    name: 'Continue?',
    done: 'Saw the game over screen, and came back',
    hint: 'Type the name of the game, or fill up the big one at the bottom of a page',
    points: 30,
    secret: true
  },
  {
    id: 'big-808',
    name: 'Big 808',
    done: 'Dropped the 808',
    hint: 'Type the name of a famous drum machine (the studio search counts)',
    points: 25,
    secret: true
  },
  {
    id: 'completionist',
    name: 'Game Complete',
    done: 'Unlocked every trophy. Thanks for playing',
    hint: 'Unlock every other trophy',
    points: 90
  }
]

export const TOTAL_POINTS = TROPHIES.reduce((sum, t) => sum + t.points, 0)
export const trophyById = (id: TrophyId) => TROPHIES.find(t => t.id === id)!

/** fired when one unlocks in this tab: detail { id } */
export const TROPHY_EVENT = 'gameover:trophy'

const KEY = 'gameover:save'
/** the sections that count towards "World Map" */
export const STAGES_TO_VISIT = ['studio', 'spotify', 'tech', 'about'] as const
const QUEUE_GOAL = 3

export type SaveFile = {
  unlocked: Partial<Record<TrophyId, number>>
  /** sections visited */
  pages: string[]
  /** beat packs opened (lowercased names) */
  packs: string[]
  /** tracks added to the queue */
  queued: number
}

const EMPTY: SaveFile = { unlocked: {}, pages: [], packs: [], queued: 0 }

let save: SaveFile | null = null
const listeners = new Set<() => void>()

function load(): SaveFile {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const data = JSON.parse(raw) as Partial<SaveFile>
    return {
      unlocked: data.unlocked && typeof data.unlocked === 'object' ? data.unlocked : {},
      pages: Array.isArray(data.pages) ? data.pages : [],
      packs: Array.isArray(data.packs) ? data.packs : [],
      queued: typeof data.queued === 'number' ? data.queued : 0
    }
  } catch {
    return EMPTY
  }
}

function commit(next: SaveFile) {
  save = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage blocked (private modes): it lasts for this visit
  }
  listeners.forEach(fn => fn())
}

/** for useSyncExternalStore */
export const readSave = (): SaveFile => (save ??= load())
export const serverSave = (): SaveFile => EMPTY

export function subscribeSave(onChange: () => void) {
  listeners.add(onChange)
  // another tab unlocked something
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return
    save = load()
    onChange()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onStorage)
  }
}

export const isUnlocked = (id: TrophyId) => !!readSave().unlocked[id]

/** Unlocks a trophy (once). Returns true if it's new. */
export function unlock(id: TrophyId): boolean {
  if (typeof window === 'undefined') return false
  const current = readSave()
  if (current.unlocked[id]) return false
  commit({ ...current, unlocked: { ...current.unlocked, [id]: Date.now() } })
  window.dispatchEvent(new CustomEvent(TROPHY_EVENT, { detail: { id } }))
  if (id !== 'completionist') checkComplete()
  return true
}

/**
 * Everything else unlocked: the last one. (Also run on load, for saves
 * from when there were more trophies to get.)
 */
export function checkComplete() {
  if (TROPHIES.every(t => t.id === 'completionist' || readSave().unlocked[t.id])) {
    unlock('completionist')
  }
}

export function notePage(section: string) {
  const current = readSave()
  if (!current.pages.includes(section)) {
    commit({ ...current, pages: [...current.pages, section] })
  }
  if (STAGES_TO_VISIT.every(s => readSave().pages.includes(s))) unlock('explorer')
}

export function notePack(name: string, allPacks: string[]) {
  const key = name.toLowerCase()
  if (!allPacks.includes(key)) return
  const current = readSave()
  if (!current.packs.includes(key)) {
    commit({ ...current, packs: [...current.packs, key] })
  }
  if (allPacks.every(p => readSave().packs.includes(p))) unlock('crate-digger')
}

export function noteQueued() {
  const current = readSave()
  const queued = current.queued + 1
  commit({ ...current, queued })
  if (queued >= QUEUE_GOAL) unlock('setlist')
}

/** Start over (the trophy case's "reset save file"). */
export function resetSave() {
  commit({ unlocked: {}, pages: [], packs: [], queued: 0 })
}
