import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { NAV_LINKS, SOCIAL_LINKS } from '@/lib/site'
import { Mark } from './brand/Mark'
import { Wordmark } from './brand/Wordmark'

/** Site footer, mounted once in the root layout. */
export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className='relative mt-24 border-t border-line sm:mt-32'>
      <div className='mx-auto grid max-w-[1240px] gap-10 px-5 pt-14 pb-10 sm:grid-cols-2 sm:px-8 md:grid-cols-[1.6fr_1fr_1fr] md:pt-16'>
        <div className='flex flex-col gap-5 sm:col-span-2 md:col-span-1'>
          <Link
            href='/'
            aria-label='GameOver home'
            className='group/mark flex w-fit items-center gap-3 rounded-md'
          >
            <Mark motion='hover' className='size-6' />
            <Wordmark className='h-[15px]' />
          </Link>
          <p className='max-w-xs text-sm leading-relaxed text-bone-muted'>
            Original trap, drill and afrobeats out of Toronto, plus the
            playlists they came from.
          </p>
        </div>

        <nav aria-label='Footer'>
          <p className='hud-label mb-4'>Explore</p>
          <ul className='flex flex-col gap-1'>
            <li>
              <Link
                href='/'
                className='inline-flex py-1 text-sm text-bone-muted transition-colors hover:text-bone'
              >
                Home
              </Link>
            </li>
            {NAV_LINKS.map(link => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  className='inline-flex py-1 text-sm text-bone-muted transition-colors hover:text-bone'
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className='hud-label mb-4'>Listen</p>
          <ul className='flex flex-col gap-1'>
            {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
              <li key={name}>
                <a
                  href={href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='group/social inline-flex items-center gap-2.5 py-1 text-sm text-bone-muted transition-colors hover:text-bone'
                >
                  <Icon className='size-3.5' aria-hidden />
                  {name}
                  <ArrowUpRight
                    aria-hidden
                    className='size-3.5 -translate-x-1 opacity-0 transition-[opacity,transform] duration-200 group-hover/social:translate-x-0 group-hover/social:opacity-100'
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        aria-hidden
        className='mx-auto max-w-[1240px] overflow-hidden px-5 sm:px-8'
      >
        <Wordmark className='w-full text-white/[0.035]' />
      </div>

      <div className='border-t border-line'>
        <div className='mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-6 font-mono text-[11px] text-bone-dim sm:flex-row sm:items-center sm:justify-between sm:px-8'>
          <p>© {year} GameOver. All rights reserved.</p>
          <p>
            Designed & built by{' '}
            <a
              href='https://omerelammary.com'
              target='_blank'
              rel='noopener noreferrer'
              className='text-bone-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-bone hover:decoration-bone'
            >
              Omer Elammary
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
