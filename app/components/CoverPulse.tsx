'use client'

import { useRef } from 'react'
import { useBeatPulse } from './useBeatPulse'

/**
 * Sits over the cover of the beat that's playing: the pads flash with the
 * kick and a playhead sweeps across once per bar, in time with the track.
 */
export function CoverPulse({ color }: { color: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useBeatPulse(ref)
  return (
    <span
      ref={ref}
      aria-hidden
      className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 data-[beat=on]:opacity-100'
    >
      <span
        className='absolute inset-0 mix-blend-screen'
        style={{
          background: `radial-gradient(circle at 50% 45%, ${color}, transparent 72%)`,
          opacity: 'calc(var(--kick) * 0.55)'
        }}
      />
      {/* playhead across the pad area (the grid sits 9.5% in from each side) */}
      <span className='absolute inset-y-[6%] right-[9.5%] left-[9.5%]'>
        <span className='absolute inset-0 translate-x-[calc(var(--bar)*100%)]'>
          <span className='absolute inset-y-0 left-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-white to-transparent shadow-[0_0_10px_rgb(255_255_255/0.9)]' />
        </span>
      </span>
    </span>
  )
}
