import { accentFor, spriteFor } from './beats'

/* ---------------------------------------------------------------------------
   A beat's pad cover as a PNG, for the lock screen / OS media controls
   (Media Session artwork has to be an image URL, not an SVG component).
   Drawn with the same sprite and colours as <BeatCover>.
--------------------------------------------------------------------------- */

const GRID = 7
const CELL = 10
const PAD = 8
const INSET = 8
const VIEW = INSET * 2 + GRID * CELL - (CELL - PAD)
const SIZE = 512

const cache = new Map<string, string>()

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function beatCoverUrl(beat: {
  id: string
  title?: string
  mood?: string
}): string | null {
  const key = `${beat.id}:${beat.title ?? ''}:${beat.mood ?? ''}`
  const hit = cache.get(key)
  if (hit) return hit
  if (typeof document === 'undefined') return null

  try {
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const color = accentFor(beat)
    const levels = spriteFor(`${beat.id}:${beat.title ?? ''}`, GRID)

    ctx.fillStyle = '#0c0b10'
    ctx.fillRect(0, 0, SIZE, SIZE)
    const glow = ctx.createRadialGradient(SIZE / 2, SIZE * 0.2, 0, SIZE / 2, SIZE * 0.2, SIZE * 0.75)
    glow.addColorStop(0, `${color}40`)
    glow.addColorStop(1, `${color}00`)
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, SIZE, SIZE)

    const k = SIZE / VIEW
    levels.forEach((row, y) =>
      row.forEach((level, x) => {
        const px = (INSET + x * CELL) * k
        const py = (INSET + y * CELL) * k
        roundRect(ctx, px, py, PAD * k, PAD * k, 1.8 * k)
        if (!level) {
          ctx.fillStyle = 'rgba(255,255,255,0.045)'
          ctx.fill()
          return
        }
        ctx.save()
        ctx.globalAlpha = level === 1 ? 0.42 : 1
        if (level === 2) {
          ctx.shadowColor = color
          ctx.shadowBlur = 18
        }
        ctx.fillStyle = color
        ctx.fill()
        ctx.restore()
        if (level === 2) {
          roundRect(ctx, px + 1.2 * k, py + 0.9 * k, (PAD - 2.4) * k, k, 0.5 * k)
          ctx.fillStyle = 'rgba(255,255,255,0.35)'
          ctx.fill()
        }
      })
    )

    const url = canvas.toDataURL('image/png')
    cache.set(key, url)
    return url
  } catch {
    return null
  }
}
