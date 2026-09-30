import { BeatTrack, type Track } from '@/app/models/Track'
import { Playlist } from '@/app/models/Playlist'
import beatsData from '@/app/api/beats/beats.json'
import packsData from '@/app/api/beats/playlists.json'

/* ---------------------------------------------------------------------------
   Catalogue
--------------------------------------------------------------------------- */

/** Hand-picked beats, in display order (hero first). */
export const FEATURED_BEAT_IDS = ['109', '91', '46', '80', '17', '79']

/**
 * The same catalogue /api/beats serves, available at build time so static
 * spots (home page quick-play, ticker) render instantly with no loading state.
 */
export const LOCAL_BEATS: BeatTrack[] = beatsData.map(
  beat => new BeatTrack(beat as unknown as BeatTrack)
)

/** The packs /api/beats/playlists serves, likewise bundled. */
export const LOCAL_PACKS: Playlist[] = packsData.map(
  pack =>
    new Playlist({
      ...(pack as unknown as ConstructorParameters<typeof Playlist>[0]),
      type: 'beat'
    })
)

export function pickFeatured(beats: BeatTrack[]) {
  return FEATURED_BEAT_IDS.map(id => beats.find(b => b.id === id)).filter(
    (b): b is BeatTrack => !!b
  )
}

/** Beats of a pack, in the pack's own order; unknown ids are skipped. */
export function packBeats(trackIds: string[] = [], beats: BeatTrack[]) {
  const byId = new Map(beats.map(b => [b.id, b]))
  return trackIds
    .map(id => byId.get(id))
    .filter((b): b is BeatTrack => !!b)
}

export function averageBpm(beats: BeatTrack[]) {
  if (!beats.length) return 0
  return Math.round(beats.reduce((sum, b) => sum + (b.bpm || 0), 0) / beats.length)
}

export function uniqueValues(values: Array<string | undefined>) {
  return [...new Set(values.filter((v): v is string => !!v))]
}

export function shuffled<T>(items: T[]) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Case-insensitive match across everything you'd search a beat by. */
export function matchesQuery(beat: BeatTrack, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [beat.title, beat.subtitle, beat.genre, beat.mood, beat.key, `${beat.bpm}`]
    .filter(Boolean)
    .some(field => field!.toLowerCase().includes(q))
}

/* ---------------------------------------------------------------------------
   Formatting
--------------------------------------------------------------------------- */

export function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatMs(ms: number) {
  return formatClock(ms / 1000)
}

export function formatLongDuration(ms: number) {
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.round((ms % 3_600_000) / 60_000)
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' '
}

/**
 * Spotify descriptions arrive as HTML ("R&amp;B", "<a href=...>"). Render
 * them as plain text instead of injecting remote HTML.
 */
export function htmlToText(html?: string | null) {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
      if (code[0] === '#') {
        const hex = code[1].toLowerCase() === 'x'
        const n = parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10)
        return Number.isFinite(n) ? String.fromCodePoint(n) : match
      }
      return ENTITIES[code.toLowerCase()] ?? match
    })
    .trim()
}

/** "Burna Boy Type Beat" -> "Burna Boy type beat" */
export function prettySubtitle(subtitle?: string) {
  if (!subtitle) return undefined
  return subtitle.replace(/\bType Beat\b/i, 'type beat')
}

/**
 * The line under a beat's title ("Burna Boy type beat"), or undefined when
 * there is none or it just repeats the title ("Yeat Type Beat").
 */
export function beatSubtitle(beat: { title?: string; subtitle?: string }) {
  const line = prettySubtitle(beat.subtitle)
  if (!line) return undefined
  if (line.toLowerCase() === beat.title?.toLowerCase()) return undefined
  return line
}

/* ---------------------------------------------------------------------------
   Genre families (the raw genre labels are granular: "NY Drill",
   "Trap/Brazilian Funk", ... so filters work on families instead)
--------------------------------------------------------------------------- */

export const GENRE_FAMILIES = [
  { id: 'trap', label: 'Trap', test: (g: string) => /trap/i.test(g) },
  { id: 'drill', label: 'Drill', test: (g: string) => /drill/i.test(g) },
  {
    id: 'afro',
    label: 'Afro',
    test: (g: string) => /afro|amapiano/i.test(g)
  },
  { id: 'funk', label: 'Funk', test: (g: string) => /funk/i.test(g) },
  {
    id: 'more',
    label: 'Hip-hop & R&B',
    test: (g: string) => /hip hop|r&b|rnb/i.test(g)
  }
] as const

export type GenreFamilyId = (typeof GENRE_FAMILIES)[number]['id']

export function inFamily(beat: BeatTrack, family: GenreFamilyId | 'all') {
  if (family === 'all') return true
  return GENRE_FAMILIES.find(f => f.id === family)!.test(beat.genre ?? '')
}

/* ---------------------------------------------------------------------------
   Colour: every beat gets an accent from its mood. Chrome stays neutral,
   covers carry the colour.
--------------------------------------------------------------------------- */

const MOOD_COLORS: Record<string, string> = {
  dark: '#FF3448',
  energetic: '#FF8A2A',
  aggressive: '#FF3DA5',
  chill: '#3BE7FF',
  melodic: '#A78BFA',
  tropical: '#C6F432',
  spacey: '#6E8BFF',
  mellow: '#52EDB5',
  remix: '#FFD23F'
}

const FALLBACK_COLORS = ['#FF3448', '#3BE7FF', '#FF8A2A', '#A78BFA', '#C6F432']

export function accentFor(track: Pick<Track, 'id'> & { mood?: string }) {
  const mood = track.mood?.toLowerCase()
  if (mood && MOOD_COLORS[mood]) return MOOD_COLORS[mood]
  return FALLBACK_COLORS[hash(track.id) % FALLBACK_COLORS.length]
}

export function packAccent(name: string) {
  const n = name.toLowerCase()
  if (n.includes('drill')) return '#FF3448'
  if (n.includes('trap')) return '#FF8A2A'
  if (n.includes('afro')) return '#C6F432'
  if (n.includes('remix')) return '#FFD23F'
  return FALLBACK_COLORS[hash(name) % FALLBACK_COLORS.length]
}

/* ---------------------------------------------------------------------------
   Deterministic pad sprites: each beat gets its own 7x7 mirrored "character",
   drawn on pads like a lit-up drum-machine grid.
--------------------------------------------------------------------------- */

export function hash(input: string) {
  // FNV-1a
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 0 = off, 1 = dim, 2 = lit */
export type PadLevel = 0 | 1 | 2
export type Sprite = PadLevel[][]

const spriteCache = new Map<string, Sprite>()

export function spriteFor(seed: string, size = 7): Sprite {
  const key = `${seed}:${size}`
  const cached = spriteCache.get(key)
  if (cached) return cached

  const half = Math.ceil(size / 2)
  let attempt = 0
  let grid: Sprite = []
  while (attempt < 24) {
    const rand = mulberry32(hash(seed) + attempt * 7919)
    grid = Array.from({ length: size }, () => Array(size).fill(0) as PadLevel[])
    let lit = 0
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < half; x++) {
        const edge = x === 0 ? 0.36 : x === half - 1 ? 0.62 : 0.52
        const rowBias = y === 0 || y === size - 1 ? 0.8 : 1
        if (rand() < edge * rowBias) {
          const level: PadLevel = rand() < 0.26 ? 1 : 2
          grid[y][x] = level
          grid[y][size - 1 - x] = level
          lit += x === half - 1 && size % 2 === 1 ? 1 : 2
        }
      }
    }
    const rowsUsed = grid.filter(r => r.some(Boolean)).length
    const centre = grid.filter(r => r[half - 1]).length
    if (lit >= 16 && lit <= 32 && rowsUsed >= size - 1 && centre >= 2) break
    attempt++
  }
  spriteCache.set(key, grid)
  return grid
}

/* ---------------------------------------------------------------------------
   5x5 pad font for pack covers
--------------------------------------------------------------------------- */

const PAD_FONT: Record<string, string[]> = {
  A: ['.XXX.', 'X...X', 'XXXXX', 'X...X', 'X...X'],
  B: ['XXXX.', 'X...X', 'XXXX.', 'X...X', 'XXXX.'],
  C: ['.XXXX', 'X....', 'X....', 'X....', '.XXXX'],
  D: ['XXXX.', 'X...X', 'X...X', 'X...X', 'XXXX.'],
  E: ['XXXXX', 'X....', 'XXXX.', 'X....', 'XXXXX'],
  F: ['XXXXX', 'X....', 'XXXX.', 'X....', 'X....'],
  G: ['.XXX.', 'X....', 'X.XXX', 'X...X', '.XXX.'],
  H: ['X...X', 'X...X', 'XXXXX', 'X...X', 'X...X'],
  I: ['XXXXX', '..X..', '..X..', '..X..', 'XXXXX'],
  J: ['..XXX', '...X.', '...X.', 'X..X.', '.XX..'],
  K: ['X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.'],
  L: ['X....', 'X....', 'X....', 'X....', 'XXXXX'],
  M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X'],
  N: ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
  P: ['XXXX.', 'X...X', 'XXXX.', 'X....', 'X....'],
  Q: ['.XXX.', 'X...X', 'X.X.X', 'X..X.', '.XX.X'],
  R: ['XXXX.', 'X...X', 'XXXX.', 'X..X.', 'X...X'],
  S: ['.XXXX', 'X....', '.XXX.', '....X', 'XXXX.'],
  T: ['XXXXX', '..X..', '..X..', '..X..', '..X..'],
  U: ['X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  V: ['X...X', 'X...X', 'X...X', '.X.X.', '..X..'],
  W: ['X...X', 'X...X', 'X.X.X', 'XX.XX', 'X...X'],
  X: ['X...X', '.X.X.', '..X..', '.X.X.', 'X...X'],
  Y: ['X...X', '.X.X.', '..X..', '..X..', '..X..'],
  Z: ['XXXXX', '...X.', '..X..', '.X...', 'XXXXX']
}

export function glyphFor(letter: string): string[] {
  return PAD_FONT[letter.toUpperCase()] ?? PAD_FONT.G
}
