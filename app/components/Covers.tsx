import Image from 'next/image'
import { accentFor, glyphFor, packAccent, spriteFor } from '@/lib/beats'
import type { Track } from '@/app/models/Track'
import { cn } from '@/lib/utils'
import { CoverPulse } from './CoverPulse'

const GRID = 7
const CELL = 10 // viewBox units per pad slot
const PAD = 8 // pad size inside a slot
const INSET = 8
const VIEW = INSET * 2 + GRID * CELL - (CELL - PAD)

type PadGridProps = {
  levels: number[][] // 0 off, 1 dim, 2 lit
  color: string
  detail?: boolean
}

function PadGrid({ levels, color, detail }: PadGridProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      className='absolute inset-0 h-full w-full'
      aria-hidden
      shapeRendering={detail ? 'geometricPrecision' : 'crispEdges'}
    >
      {levels.flatMap((row, y) =>
        row.map((level, x) => {
          const px = INSET + x * CELL
          const py = INSET + y * CELL
          if (!level) {
            return (
              <rect
                key={`${x}-${y}`}
                x={px}
                y={py}
                width={PAD}
                height={PAD}
                rx={1.8}
                fill='#ffffff'
                fillOpacity={0.045}
              />
            )
          }
          return (
            <g key={`${x}-${y}`}>
              <rect
                x={px}
                y={py}
                width={PAD}
                height={PAD}
                rx={1.8}
                fill={color}
                fillOpacity={level === 1 ? 0.42 : 1}
              />
              {detail && level === 2 && (
                <rect
                  x={px + 1.2}
                  y={py + 0.9}
                  width={PAD - 2.4}
                  height={1}
                  rx={0.5}
                  fill='#ffffff'
                  fillOpacity={0.35}
                />
              )}
            </g>
          )
        })
      )}
    </svg>
  )
}

type CoverFrameProps = {
  color: string
  className?: string
  glow?: boolean
  /** the beat that's playing: pulse with it */
  live?: boolean
  children: React.ReactNode
}

function CoverFrame({ color, className, glow, live, children }: CoverFrameProps) {
  return (
    <div
      className={cn(
        'relative isolate aspect-square shrink-0 overflow-hidden rounded-xl bg-ink-900 ring-1 ring-white/8 ring-inset',
        className
      )}
      style={{
        backgroundImage: `radial-gradient(120% 90% at 50% 20%, ${color}33, transparent 62%), radial-gradient(80% 60% at 50% 110%, ${color}1f, transparent 70%)`
      }}
    >
      <div
        className='absolute inset-0'
        style={glow ? { filter: `drop-shadow(0 0 10px ${color}99)` } : undefined}
      >
        {children}
      </div>
      {live && <CoverPulse color={color} />}
    </div>
  )
}

type BeatCoverProps = {
  beat: { id: string; title?: string; mood?: string }
  className?: string
  glow?: boolean
  detail?: boolean
  /** the beat that's playing: pulse with it */
  live?: boolean
}

/** Generated cover for a beat: its own pad "character", coloured by mood. */
export function BeatCover({ beat, className, glow, detail, live }: BeatCoverProps) {
  const color = accentFor(beat)
  const sprite = spriteFor(`${beat.id}:${beat.title ?? ''}`, GRID)
  return (
    <CoverFrame color={color} className={className} glow={glow} live={live}>
      <PadGrid levels={sprite} color={color} detail={detail} />
    </CoverFrame>
  )
}

/** Beat pack cover: the pack's initial spelled out on the pad grid. */
export function PackCover({
  name,
  className,
  glow,
  detail
}: {
  name: string
  className?: string
  glow?: boolean
  detail?: boolean
}) {
  const color = packAccent(name)
  const glyph = glyphFor(name.trim()[0] ?? 'G')
  const levels = Array.from({ length: GRID }, (_, y) =>
    Array.from({ length: GRID }, (_, x) => {
      const gy = y - 1
      const gx = x - 1
      if (gy < 0 || gy > 4 || gx < 0 || gx > 4) return 0
      return glyph[gy][gx] === 'X' ? 2 : 0
    })
  )
  return (
    <CoverFrame color={color} className={className} glow={glow}>
      <PadGrid levels={levels} color={color} detail={detail} />
    </CoverFrame>
  )
}

/**
 * Artwork for anything playable: Spotify art when there is some, otherwise
 * the generated pad cover.
 */
export function TrackArt({
  track,
  className,
  sizes = '48px',
  glow,
  detail,
  priority,
  loading,
  live
}: {
  track: Pick<Track, 'id' | 'title' | 'artworkUrl'> & { mood?: string }
  className?: string
  sizes?: string
  glow?: boolean
  detail?: boolean
  priority?: boolean
  /** 'eager' for art that's just off screen but about to slide in */
  loading?: 'eager' | 'lazy'
  /** the beat that's playing: pulse with it */
  live?: boolean
}) {
  if (track.artworkUrl) {
    return (
      <div
        className={cn(
          'relative aspect-square shrink-0 overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/8 ring-inset',
          className
        )}
      >
        <Image
          src={track.artworkUrl}
          alt=''
          fill
          sizes={sizes}
          className='object-cover'
          priority={priority}
          loading={priority ? undefined : loading}
        />
      </div>
    )
  }
  return (
    <BeatCover
      beat={track}
      className={className}
      glow={glow}
      detail={detail}
      live={live}
    />
  )
}
