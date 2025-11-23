'use client'

import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'
type ButtonShape = 'pill' | 'rounded'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  shape?: ButtonShape
  hoverColor?: string // Hex color for secondary button hover fill
}

export function Button({
  children,
  variant = 'primary',
  shape = 'pill',
  hoverColor,
  className,
  style,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07050A] text-sm sm:text-base'

  const shapeClasses =
    shape === 'pill' ? 'rounded-full px-8 py-3' : 'rounded-lg px-7 py-3'

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'relative overflow-hidden rounded-full px-8 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-fuchsia-500/40 active:translate-y-0 active:scale-[0.98]',
    secondary: hoverColor
      ? 'rounded-full px-8 py-3 border border-gray-600/70 text-gray-200 bg-black/10 transition-all duration-300 hover:text-white hover:translate-y-[-2px] active:translate-y-0 active:scale-[0.98]'
      : 'rounded-full px-8 py-3 border border-gray-600/70 text-gray-200 bg-black/10 transition-all duration-300 hover:bg-white/5 hover:border-gray-300 hover:translate-y-[-2px] active:translate-y-0 active:scale-[0.98]',
    ghost:
      'text-gray-300 hover:text-white hover:bg-white/5 active:scale-[0.98]',
    outline:
      'rounded-full px-8 py-3 border border-cyan-400/40 text-cyan-300 transition-all duration-300 hover:border-cyan-300 hover:text-cyan-100 hover:bg-cyan-300/10 active:scale-[0.98]'
  }

  // Custom CSS variables for hover color
  const customStyle = hoverColor
    ? {
        ...style,
        '--hover-bg-color': hoverColor,
        '--hover-border-color': hoverColor
      }
    : style

  return (
    <button
      className={clsx(
        base,
        shapeClasses,
        variantClasses[variant],
        hoverColor &&
          variant === 'secondary' &&
          'hover:border-[var(--hover-border-color)] hover:bg-[var(--hover-bg-color)]',
        className
      )}
      style={customStyle as React.CSSProperties}
      {...props}
    >
      {children}
    </button>
  )
}
