/* ---------------------------------------------------------------------------
   Beat clock: lets visuals move in time with whatever beat is playing.

   Every beat in the catalogue has its BPM, so the position in the track
   (audio.currentTime) gives the beat position directly — no Web Audio graph,
   which would silence cross-origin S3 audio without CORS headers.
   Spotify tracks have no tempo here, so they don't drive the clock.
--------------------------------------------------------------------------- */

type Source = { audio: HTMLAudioElement; bpm: number }

let source: Source | null = null

/** Called by the player when a beat loads (or with null when it stops). */
export function setBeatSource(audio: HTMLAudioElement | null, bpm?: number) {
  source = audio && bpm && bpm > 0 ? { audio, bpm } : null
}

export type BeatState = {
  /** a beat with a tempo is currently playing */
  playing: boolean
  bpm: number
  /** beats elapsed since the start of the track (fractional) */
  beats: number
  /** 0 → 1 through the current beat */
  phase: number
  /** 1 on each downbeat, decaying to 0 (a kick) */
  kick: number
  /** 1 on each 16th note, decaying fast (hi-hats) */
  hat: number
  /** 0–15: the 16th-note step in the bar */
  step: number
}

const IDLE: BeatState = {
  playing: false,
  bpm: 0,
  beats: 0,
  phase: 0,
  kick: 0,
  hat: 0,
  step: 0
}

export function readBeat(): BeatState {
  const s = source
  if (!s || s.audio.paused || !Number.isFinite(s.audio.currentTime)) return IDLE
  const beats = (s.audio.currentTime * s.bpm) / 60
  const phase = beats - Math.floor(beats)
  const sixteenth = beats * 4
  const hatPhase = sixteenth - Math.floor(sixteenth)
  return {
    playing: true,
    bpm: s.bpm,
    beats,
    phase,
    kick: Math.exp(-phase * 7),
    hat: Math.exp(-hatPhase * 9),
    step: Math.floor(sixteenth) % 16
  }
}
