'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { Trophy } from 'lucide-react'
import { TROPHIES, readSave, serverSave, subscribeSave } from '@/lib/trophies'
import { cn } from '@/lib/utils'

/** "3/13 trophies" in the footer, to the trophy case on the About page. */
export function TrophyLink({ className }: { className?: string }) {
  const save = useSyncExternalStore(subscribeSave, readSave, serverSave)
  const got = TROPHIES.filter(t => save.unlocked[t.id]).length
  return (
    <Link
      href='/about#trophies'
      className={cn(
        'group/trophy inline-flex items-center gap-2 rounded-md py-1 text-bone-muted transition-colors hover:text-warn',
        className
      )}
    >
      <Trophy
        aria-hidden
        className='size-3.5 transition-[rotate,scale] duration-300 ease-pad group-hover/trophy:scale-110 group-hover/trophy:-rotate-12'
      />
      <span>
        <span className='tabular'>
          {got}/{TROPHIES.length}
        </span>{' '}
        trophies
      </span>
    </Link>
  )
}
