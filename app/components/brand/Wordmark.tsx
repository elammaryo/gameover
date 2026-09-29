import { cn } from '@/lib/utils'

type WordmarkProps = {
  className?: string
  /** red/cyan chromatic offset behind the letters (brand signature) */
  split?: boolean
  /** jitter the split when an ancestor `group/wordmark` is hovered */
  glitchOnHover?: boolean
}

/**
 * The GAMEOVER logotype, traced to vector from the original PNG so it stays
 * crisp at any size. Rendered as a CSS mask so it takes `currentColor`.
 */
export function Wordmark({
  className,
  split = false,
  glitchOnHover = false
}: WordmarkProps) {
  return (
    <span
      role='img'
      aria-label='GameOver'
      className={cn(
        'relative inline-block aspect-[769/90] text-bone',
        className
      )}
    >
      {split && (
        <>
          <span
            aria-hidden
            className={cn(
              'wordmark-mask absolute inset-0 translate-x-[-0.55%] bg-signal opacity-90 mix-blend-screen',
              glitchOnHover &&
                'transition-transform duration-200 group-hover/wordmark:translate-x-[-1.2%] group-hover/wordmark:animate-[glitch-x_240ms_steps(2,end)_2]'
            )}
          />
          <span
            aria-hidden
            className={cn(
              'wordmark-mask absolute inset-0 translate-x-[0.55%] bg-live opacity-80 mix-blend-screen',
              glitchOnHover &&
                'transition-transform duration-200 group-hover/wordmark:translate-x-[1.2%]'
            )}
          />
        </>
      )}
      <span
        aria-hidden
        className='wordmark-mask absolute inset-0 bg-current'
      />
    </span>
  )
}
