/* ---------------------------------------------------------------------------
   Small helpers shared by the touch gestures (the track pager, the Now
   Playing sheet).
--------------------------------------------------------------------------- */

/** how far a finger moves before it counts as a swipe or a pull (px) */
export const SLOP = 8

/** Pulling past the end: it gives, less and less the further you go (like iOS). */
export function rubberBand(offset: number, size: number) {
  const d = Math.max(size, 1)
  return Math.sign(offset) * (1 - 1 / ((Math.abs(offset) * 0.55) / d + 1)) * d
}

/**
 * Speed in px/s over the last ~100 ms of `trail` ([time, position] pairs),
 * so holding still before letting go counts as 0.
 */
export function velocityOf(trail: Array<[number, number]>, now: number) {
  const recent = trail.filter(([t]) => now - t <= 100)
  if (recent.length < 2) return 0
  const [t0, p0] = recent[0]
  const [t1, p1] = recent[recent.length - 1]
  return t1 > t0 ? ((p1 - p0) / (t1 - t0)) * 1000 : 0
}

/**
 * The speed a (critically damped) spring back to 0 from `at` can start
 * with and still come to rest without overshooting: a fast throw carries
 * the motion on, but never past where it's going.
 */
export function landingVelocity(at: number, velocity: number, stiffness: number) {
  const towards = Math.sign(velocity) === -Math.sign(at)
  if (!towards) return velocity
  const max = Math.sqrt(stiffness) * Math.abs(at)
  return Math.sign(velocity) * Math.min(Math.abs(velocity), max)
}

/** keeps the last few samples of a gesture */
export function track(trail: Array<[number, number]>, time: number, position: number) {
  trail.push([time, position])
  if (trail.length > 12) trail.shift()
}
