import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------------------
   Small presentational pieces shared by every page
--------------------------------------------------------------------------- */

/** Mono uppercase label with a lit pad in front of it */
export function Eyebrow({
  children,
  className,
  color = 'var(--color-signal)',
  as: Tag = 'p'
}: {
  children: React.ReactNode
  className?: string
  color?: string
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'span'
}) {
  return (
    <Tag className={cn('hud-label flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className='size-[7px] shrink-0 rounded-[2px]'
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
      />
      {children}
    </Tag>
  )
}

export function PageHeader({
  eyebrow,
  eyebrowIcon,
  title,
  children,
  aside,
  className
}: {
  eyebrow: React.ReactNode
  eyebrowIcon?: React.ReactNode
  title: React.ReactNode
  children?: React.ReactNode
  aside?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        className
      )}
    >
      <div className='flex max-w-3xl flex-col gap-5'>
        <div className='flex items-center gap-3'>
          {eyebrowIcon}
          <Eyebrow as='p'>{eyebrow}</Eyebrow>
        </div>
        <h1 className='font-display-wide text-[clamp(2.6rem,7vw,5.25rem)] text-balance text-bone'>
          {title}
        </h1>
        {children && (
          <div className='max-w-2xl text-base leading-relaxed text-pretty text-bone-muted sm:text-lg'>
            {children}
          </div>
        )}
      </div>
      {aside}
    </header>
  )
}

export function SectionHeader({
  title,
  eyebrow,
  action,
  className,
  id
}: {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  action?: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3',
        className
      )}
    >
      <div className='flex flex-col gap-3'>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2
          id={id}
          className='font-display-tight text-2xl text-bone sm:text-[1.75rem]'
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}

/** HUD readout: big mono numbers with small labels, divided like a console */
export function StatStrip({
  items,
  className
}: {
  items: Array<{
    label: string
    value: React.ReactNode
    hint?: string
    accent?: string
  }>
  className?: string
}) {
  return (
    <dl
      className={cn(
        'surface grid grid-cols-2 overflow-hidden rounded-2xl sm:grid-cols-4',
        className
      )}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            'relative flex flex-col gap-2 px-5 py-4 sm:px-6 sm:py-5',
            i % 2 === 1 && 'border-l border-line',
            i >= 2 && 'border-t border-line sm:border-t-0',
            i > 0 && 'sm:border-l'
          )}
        >
          <dt className='hud-label'>{item.label}</dt>
          <dd
            className='tabular font-mono text-2xl font-medium tracking-tight text-bone sm:text-[1.75rem]'
            style={item.accent ? { color: item.accent } : undefined}
          >
            {item.value}
            {item.hint && (
              <span className='ml-1.5 text-xs font-normal tracking-normal text-bone-dim'>
                {item.hint}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function Tag({
  children,
  className,
  dot
}: {
  children: React.ReactNode
  className?: string
  dot?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-md border border-line bg-white/[0.03] px-2 font-mono text-[10.5px] tracking-[0.08em] whitespace-nowrap text-bone-muted uppercase',
        className
      )}
    >
      {dot && (
        <span
          aria-hidden
          className='size-1.5 rounded-[2px]'
          style={{ backgroundColor: dot }}
        />
      )}
      {children}
    </span>
  )
}

/** Animated level meter used wherever something is playing */
export function EqBars({
  className,
  playing = true
}: {
  className?: string
  playing?: boolean
}) {
  return (
    <span
      aria-hidden
      className={cn('inline-flex h-3.5 items-end gap-[2px]', className)}
    >
      {[0, 180, 90, 260].map((delay, i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] rounded-[1px] bg-live',
            playing ? 'eq-bar h-full' : 'h-1'
          )}
          style={playing ? { animationDelay: `${delay}ms` } : undefined}
        />
      ))}
    </span>
  )
}

type PlayButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  playing?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  tone?: 'signal' | 'bone' | 'ghost'
  label: string
}

const playSizes = {
  sm: 'size-8 [&_svg]:size-3.5',
  md: 'size-10 [&_svg]:size-4',
  lg: 'size-12 [&_svg]:size-5',
  xl: 'size-16 [&_svg]:size-6'
}

const playTones = {
  signal:
    'bg-signal text-ink-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-2px_0_rgb(0_0_0/0.2),0_10px_28px_-10px_rgb(255_52_72/0.85)] hover:bg-signal-hi',
  bone: 'bg-bone text-ink-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.15)] hover:bg-white',
  ghost:
    'bg-white/[0.06] text-bone ring-1 ring-white/10 ring-inset hover:bg-white/[0.12]'
}

export function PlayButton({
  playing,
  size = 'md',
  tone = 'signal',
  label,
  className,
  ...props
}: PlayButtonProps) {
  return (
    <button
      type='button'
      aria-label={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full transition-[transform,background-color] duration-200 ease-snap hover:scale-[1.06] active:scale-95 disabled:opacity-40',
        playSizes[size],
        playTones[tone],
        className
      )}
      {...props}
    >
      {playing ? (
        <Pause fill='currentColor' strokeWidth={0} />
      ) : (
        <Play fill='currentColor' strokeWidth={0} className='translate-x-[1px]' />
      )}
    </button>
  )
}
