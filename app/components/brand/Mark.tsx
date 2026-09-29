import { MARK_PATTERN, MARK_SEQUENCE } from '@/lib/beats'
import { cn } from '@/lib/utils'

const ORDER = new Map(MARK_SEQUENCE.map(([x, y], i) => [`${x}:${y}`, i]))

type MarkProps = {
  className?: string
  /**
   * none  – static
   * hover – pads fire in sequence when an ancestor with `group/mark` is hovered
   * loop  – pads light up in sequence forever (loading states)
   */
  motion?: 'none' | 'hover' | 'loop'
  /** draw the unlit pads too, so the grid reads as a pad controller */
  showUnlit?: boolean
  title?: string
}

/**
 * The GameOver mark: a "G" lit up on a 5x5 pad grid, with one cyan pad
 * mid-hit. Same geometry as app/icon.svg.
 */
export function Mark({
  className,
  motion = 'none',
  showUnlit = false,
  title
}: MarkProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      className={cn('shrink-0 overflow-visible', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {MARK_PATTERN.flatMap((row, y) =>
        row.split('').map((ch, x) => {
          const lit = ch !== '.'
          if (!lit && !showUnlit) return null
          const i = ORDER.get(`${x}:${y}`) ?? 0
          return (
            <rect
              key={`${x}-${y}`}
              x={x * 5}
              y={y * 5}
              width={4}
              height={4}
              rx={1}
              fill={
                !lit
                  ? 'rgb(255 255 255 / 0.07)'
                  : ch === 'H'
                    ? 'var(--color-live)'
                    : 'var(--color-signal)'
              }
              className={cn(
                lit &&
                  motion === 'hover' &&
                  'group-hover/mark:animate-[pad-hit_460ms_var(--ease-snap)_both]',
                lit &&
                  motion === 'loop' &&
                  'animate-[pad-snake_1400ms_var(--ease-snap)_infinite_both]'
              )}
              style={
                lit && motion !== 'none'
                  ? {
                      animationDelay: `${i * (motion === 'loop' ? 70 : 38)}ms`,
                      transformBox: 'fill-box',
                      transformOrigin: 'center'
                    }
                  : undefined
              }
            />
          )
        })
      )}
    </svg>
  )
}
