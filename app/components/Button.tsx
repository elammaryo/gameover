import { cn } from '@/lib/utils'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'spotify'
  | 'soundcloud'
type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonShape = 'pad' | 'pill' | 'rounded'

const base =
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.01em] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-snap focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-live disabled:pointer-events-none disabled:opacity-40 active:translate-y-px active:scale-[0.985]'

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-[15px]'
}

const shapes: Record<ButtonShape, string> = {
  pad: 'rounded-xl',
  rounded: 'rounded-xl',
  pill: 'rounded-full'
}

const variants: Record<ButtonVariant, string> = {
  // a lit pad: signal red, ink label, bevelled like a real rubber pad
  primary:
    'bg-signal text-ink-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-2px_0_rgb(0_0_0/0.22),0_12px_32px_-12px_rgb(255_52_72/0.75)] hover:-translate-y-px hover:bg-signal-hi hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-2px_0_rgb(0_0_0/0.22),0_16px_40px_-12px_rgb(255_52_72/0.9)]',
  secondary:
    'bg-ink-800 text-bone border border-line-strong shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] hover:-translate-y-px hover:bg-ink-700 hover:border-white/20',
  outline:
    'border border-line-strong text-bone hover:border-white/30 hover:bg-white/[0.04]',
  ghost: 'text-bone-muted hover:bg-white/[0.05] hover:text-bone',
  spotify:
    'bg-spotify text-ink-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_12px_32px_-14px_rgb(30_215_96/0.7)] hover:-translate-y-px hover:brightness-110',
  soundcloud:
    'bg-soundcloud text-ink-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_12px_32px_-14px_rgb(255_85_0/0.7)] hover:-translate-y-px hover:brightness-110'
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  shape = 'pad',
  className
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  className?: string
} = {}) {
  return cn(base, sizes[size], shapes[shape], variants[variant], className)
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
}

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'pad',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, shape, className })}
      {...props}
    />
  )
}
