import { cn } from '@/lib/utils'

/**
 * The original GAMEOVER title, exactly as designed: its cyan → violet →
 * magenta gradient over the letterforms, traced to vector from
 * public/gameover-logo.png so it stays crisp at any size. The gradient
 * stops are sampled from that PNG.
 *
 * `tone="mono"` takes `currentColor` instead (faint watermarks).
 */
export const BRAND_GRADIENT =
  'linear-gradient(90deg, #17EEFD 0%, #1AE5FA 10%, #1ADFF7 16%, #26C9F2 22%, #33B4EB 31%, #3B9DE6 38%, #478AE2 47%, #5579DE 53%, #6669E0 62%, #7B61DD 69%, #8A58DD 75%, #A04FDE 81%, #B24BE4 87%, #C93AE3 94%, #DC32EE 100%)'

export function Wordmark({
  className,
  tone = 'brand',
  label = 'GameOver'
}: {
  className?: string
  tone?: 'brand' | 'mono'
  /** null when the surrounding link or heading already names it */
  label?: string | null
}) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={cn('relative inline-block aspect-[769/90]', className)}
    >
      <span
        aria-hidden
        className={cn('wordmark-mask absolute inset-0', tone === 'mono' && 'bg-current')}
        style={tone === 'brand' ? { backgroundImage: BRAND_GRADIENT } : undefined}
      />
    </span>
  )
}
