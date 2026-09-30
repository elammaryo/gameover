import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { buttonClasses } from './components/Button'
import { ContinueCountdown } from './components/ContinueCountdown'
import { GIcon } from './components/brand/GIcon'

export const metadata: Metadata = {
  title: 'Page not found'
}

export default function NotFound() {
  return (
    <main className='mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[1240px] flex-col items-center justify-center px-5 pt-[calc(var(--nav-h)+2rem)] pb-10 text-center sm:px-8'>
      <GIcon label={null} className='size-28 sm:size-32' />

      <p className='hud-label mt-10'>Error 404 · Level not found</p>

      <h1 className='text-split mt-5 font-pixel text-[clamp(3.4rem,13vw,9.5rem)] leading-[0.9] font-bold text-bone'>
        Game
        <br className='sm:hidden' /> over
      </h1>

      <p className='mt-7 max-w-md text-lg leading-relaxed text-pretty text-bone-muted'>
        This level doesn’t exist. The link may be broken, or the page moved to
        a different stage.
      </p>

      <div className='mt-10'>
        <ContinueCountdown />
        <span className='sr-only'>Continue?</span>
      </div>

      <div className='mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
        <Link href='/' className={buttonClasses({ size: 'lg' })}>
          <RotateCcw className='size-4' />
          Continue from home
        </Link>
        <Link
          href='/studio'
          className={buttonClasses({ size: 'lg', variant: 'secondary', className: 'group/cta' })}
        >
          Enter the studio
          <ArrowRight className='size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5' />
        </Link>
      </div>
    </main>
  )
}
