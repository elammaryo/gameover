import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  LoaderCircle,
  Pause,
  Play
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonClasses } from './Button'

/* ---------------------------------------------------------------------------
   Small presentational pieces shared by every page
--------------------------------------------------------------------------- */

/** Page shell: content column aligned with the player dock, clear of the nav. */
export function Page({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <main
      className={cn(
        'mx-auto w-full max-w-[1240px] px-5 pt-[calc(var(--nav-h)+2.25rem)] pb-8 sm:px-8 sm:pt-[calc(var(--nav-h)+3.5rem)]',
        className
      )}
    >
      {children}
    </main>
  )
}

export function BackLink({
  href,
  children
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className='group/back hud-label -ml-1 inline-flex items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:text-bone'
    >
      <ArrowLeft className='size-3.5 transition-transform duration-200 ease-snap group-hover/back:-translate-x-0.5' />
      {children}
    </Link>
  )
}

/** Toggle chip with a lit pad, same language as the nav. */
export function FilterChip({
  active,
  count,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean
  count?: number
}) {
  return (
    <button
      type='button'
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 font-mono text-[11px] tracking-[0.12em] uppercase transition-[background-color,border-color,color] duration-200',
        active
          ? 'border-line-strong bg-white/[0.07] text-bone'
          : 'border-line text-bone-dim hover:border-line-strong hover:text-bone',
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-[2px] transition-[background-color,box-shadow] duration-200',
          active
            ? 'bg-theme shadow-[0_0_8px_var(--color-theme)]'
            : 'bg-white/20'
        )}
      />
      {children}
      {count !== undefined && (
        <span className='tabular text-bone-dim'>{count}</span>
      )}
    </button>
  )
}

/** Big section tabs (Beats / Packs). Pair with role=tabpanel content. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  idPrefix,
  className
}: {
  tabs: Array<{ id: T; label: string; count?: number; shot?: string }>
  value: T
  onChange: (id: T) => void
  idPrefix: string
  className?: string
}) {
  return (
    <div
      role='tablist'
      className={cn('flex items-center gap-7 sm:gap-9', className)}
      onKeyDown={e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        const i = tabs.findIndex(t => t.id === value)
        const next =
          tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
        onChange(next.id)
        document.getElementById(`${idPrefix}-tab-${next.id}`)?.focus()
      }}
    >
      {tabs.map(tab => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-tab-${tab.id}`}
            type='button'
            role='tab'
            data-shot={tab.shot}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'group/tab relative flex items-center gap-3 py-2 transition-colors duration-200',
              selected ? 'text-bone' : 'text-bone-dim hover:text-bone'
            )}
          >
            <span
              aria-hidden
              className={cn(
                'size-2 rounded-[2px] transition-all duration-200',
                selected
                  ? 'bg-theme shadow-[0_0_10px_var(--color-theme)]'
                  : 'scale-75 bg-white/15 group-hover/tab:bg-white/30'
              )}
            />
            <span className='font-display-tight text-2xl sm:text-[1.75rem]'>
              {tab.label}
            </span>
            {tab.count !== undefined && (
              <span className='tabular font-mono text-xs text-bone-dim'>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Wide call-to-action panel (SoundCloud, Spotify profile, GitHub...). */
export function CtaBand({
  icon,
  title,
  children,
  href,
  cta,
  accent = 'var(--color-theme)',
  variant = 'secondary',
  className
}: {
  icon: React.ReactNode
  title: React.ReactNode
  children: React.ReactNode
  href: string
  cta: string
  accent?: string
  variant?: 'primary' | 'secondary' | 'spotify' | 'soundcloud'
  className?: string
}) {
  const external = href.startsWith('http')
  const button = (
    <>
      {cta}
      {external ? (
        <ArrowUpRight className='size-4' />
      ) : (
        <ArrowRight className='size-4' />
      )}
    </>
  )
  return (
    <section
      className={cn(
        'glow-card surface overflow-hidden rounded-3xl p-6 sm:p-10 [--glow-size:44rem]',
        className
      )}
      style={
        {
          '--glow': accent,
          backgroundImage: `radial-gradient(60% 120% at 100% 50%, color-mix(in srgb, ${accent} 16%, transparent), transparent 70%)`
        } as React.CSSProperties
      }
    >
      <div className='flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10'>
        <div className='flex items-start gap-4 sm:gap-5'>
          <span
            className='flex size-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-[scale,rotate] duration-300 ease-pad lit:scale-110 lit:-rotate-6 [&_svg]:size-[22px]'
            style={{
              color: accent,
              backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 28%, transparent)`
            }}
          >
            {icon}
          </span>
          <div className='flex flex-col gap-1.5'>
            <h2 className='font-display-tight text-xl text-bone sm:text-2xl'>
              {title}
            </h2>
            <p className='max-w-xl text-[15px] leading-relaxed text-bone-muted'>
              {children}
            </p>
          </div>
        </div>
        {external ? (
          <a
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            className={buttonClasses({ variant, className: 'shrink-0 self-start sm:self-auto' })}
          >
            {button}
          </a>
        ) : (
          <Link
            href={href}
            className={buttonClasses({ variant, className: 'shrink-0 self-start sm:self-auto' })}
          >
            {button}
          </Link>
        )}
      </div>
    </section>
  )
}

/** Friendly "nothing here" panel with an unlit pad grid. */
export function EmptyState({
  title,
  children,
  action,
  className
}: {
  title: string
  children?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center',
        className
      )}
    >
      <span aria-hidden className='grid grid-cols-3 gap-1'>
        {Array.from({ length: 9 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'size-2.5 rounded-[3px]',
              i === 4 ? 'bg-theme/70' : 'bg-white/10'
            )}
          />
        ))}
      </span>
      <div className='flex flex-col gap-1.5'>
        <p className='font-display-tight text-lg text-bone'>{title}</p>
        {children && (
          <p className='max-w-sm text-sm text-bone-muted'>{children}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-xl bg-white/[0.045]', className)}
    />
  )
}

/** Mono uppercase label with a lit pad in front of it */
export function Eyebrow({
  children,
  className,
  color = 'var(--color-theme)',
  as: Tag = 'p'
}: {
  children: React.ReactNode
  className?: string
  color?: string
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'span'
}) {
  return (
    <Tag
      className={cn('hud-label flex items-center gap-2.5 text-bone-muted', className)}
    >
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
      {/* rises in on arrival (paused under a stage transition) */}
      <div className='flex max-w-3xl flex-col gap-5'>
        <div className='intro-rise flex items-center gap-3'>
          {eyebrowIcon}
          <Eyebrow as='p'>{eyebrow}</Eyebrow>
        </div>
        <h1
          className='intro-rise font-display-wide text-[clamp(2.4rem,10.5vw,5.25rem)] text-balance break-words text-bone'
          style={{ '--i': 1 } as React.CSSProperties}
        >
          {title}
        </h1>
        {children && (
          <div
            className='intro-rise max-w-2xl text-base leading-relaxed text-pretty text-bone-muted sm:text-lg'
            style={{ '--i': 2 } as React.CSSProperties}
          >
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
  /** 4 items: 2x2 on phones, one row from sm. 3 items: always one row. */
  items: Array<{
    label: string
    value: React.ReactNode
    hint?: string
    accent?: string
  }>
  className?: string
}) {
  const three = items.length === 3
  return (
    <dl
      className={cn(
        'surface grid overflow-hidden rounded-2xl',
        three ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4',
        className
      )}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          style={
            {
              '--i': i + 3,
              ...(item.accent ? { '--glow': item.accent } : null)
            } as React.CSSProperties
          }
          className={cn(
            // values share a baseline even when a label wraps
            'intro-rise glow-card glow-flat flex min-w-0 flex-col justify-between gap-2 px-4 py-4 [--glow-size:18rem] sm:px-6 sm:py-5',
            three
              ? i > 0 && 'border-l border-line'
              : [
                  i % 2 === 1 && 'border-l border-line',
                  i >= 2 && 'border-t border-line sm:border-t-0',
                  i > 0 && 'sm:border-l'
                ]
          )}
        >
          <dt className='hud-label transition-colors duration-300 lit:text-bone-muted'>
            {item.label}
          </dt>
          <dd
            className='tabular origin-left font-mono text-2xl font-medium tracking-tight text-bone transition-[scale,text-shadow] duration-300 ease-pad lit:scale-105 lit:[text-shadow:0_0_18px_var(--glow)] sm:text-[1.75rem]'
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
export { EqBars } from './EqBars'

type PlayButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  playing?: boolean
  /** waiting for audio: a spinner takes over (after a beat, so fast loads don't flicker) */
  loading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** accent = the section colour (red in the studio, green on Spotify...) */
  tone?: 'accent' | 'bone' | 'ghost'
  label: string
  /**
   * The button's ::after stretches over its row/card (pass the `after:`
   * classes). Stretched buttons skip the hover/press scale: any transform
   * would make the button the containing block and shrink the hit area.
   */
  stretched?: boolean
}

const playSizes = {
  sm: 'size-8 [&_svg]:size-3.5',
  md: 'size-10 [&_svg]:size-4',
  lg: 'size-12 [&_svg]:size-5',
  xl: 'size-16 [&_svg]:size-6'
}

const playTones = {
  accent:
    'bg-theme text-ink-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-2px_0_rgb(0_0_0/0.2),0_10px_28px_-10px_color-mix(in_srgb,var(--color-theme)_85%,transparent)] hover:bg-theme-hi',
  bone: 'bg-bone text-ink-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.15)] hover:bg-white',
  ghost:
    'bg-white/[0.06] text-bone ring-1 ring-white/10 ring-inset hover:bg-white/[0.12]'
}

// icons swap with a little pop; the spinner fades in only if loading lasts
const iconSwap =
  'col-start-1 row-start-1 transition-[opacity,scale,rotate] duration-200 ease-pad motion-reduce:transition-none'

export function PlayButton({
  playing,
  loading = false,
  size = 'md',
  tone = 'accent',
  label,
  stretched = false,
  className,
  ...props
}: PlayButtonProps) {
  // while loading, whichever icon was showing holds for 200ms, then the
  // spinner takes over (so quick loads never flash a spinner)
  const iconState = (visible: boolean) =>
    visible
      ? 'scale-100 rotate-0 opacity-100'
      : cn('scale-50 opacity-0', loading && 'delay-200')
  return (
    <button
      type='button'
      aria-label={label}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-[scale,background-color,color] duration-200 ease-snap disabled:opacity-40',
        stretched
          ? 'static after:absolute after:inset-0'
          : 'relative hover:scale-[1.06] active:scale-95',
        playSizes[size],
        playTones[tone],
        className
      )}
      {...props}
    >
      <span aria-hidden className='grid place-items-center'>
        <Play
          fill='currentColor'
          strokeWidth={0}
          className={cn(
            iconSwap,
            'translate-x-[1px]',
            iconState(!playing && !loading),
            playing && !loading && '-rotate-90'
          )}
        />
        <Pause
          fill='currentColor'
          strokeWidth={0}
          className={cn(
            iconSwap,
            iconState(!!playing && !loading),
            !playing && !loading && 'rotate-90'
          )}
        />
        {loading && (
          <LoaderCircle
            strokeWidth={2.5}
            className='play-spinner col-start-1 row-start-1'
          />
        )}
      </span>
    </button>
  )
}
