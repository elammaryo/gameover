/* ---------------------------------------------------------------------------
   Arcade sound effects, synthesised on the spot with Web Audio (oscillators
   and a noise buffer), so there are no files to load. Only ever triggered by
   a click or key press, never on their own. Visitors can switch them off on
   the title screen; the choice is remembered on this device.

   This AudioContext is separate from the beat player, which plays through a
   plain <audio> element (routing that through Web Audio would silence the
   cross-origin S3 streams).
--------------------------------------------------------------------------- */

const KEY = 'gameover:sfx'
const CHANGE = 'gameover:sfx-change'
// fallback when storage is blocked (private modes): this page view only
let memory: boolean | null = null

export function sfxEnabled(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSfxEnabled(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    memory = on
  }
  window.dispatchEvent(new Event(CHANGE))
}

/** for useSyncExternalStore */
export function subscribeSfx(onChange: () => void) {
  window.addEventListener(CHANGE, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE, onChange)
    window.removeEventListener('storage', onChange)
  }
}
export const readSfx = () => memory ?? sfxEnabled()

/* ------------------------------------------------------------------------ */

type Rig = { ctx: AudioContext; out: AudioNode; noise: AudioBuffer }
let rig: Rig | null = null

function getRig(): Rig | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AC) return null
  if (!rig) {
    const ctx = new AC()
    // a little glue so stacked hits never clip
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -12
    comp.knee.value = 6
    comp.ratio.value = 6
    comp.attack.value = 0.003
    comp.release.value = 0.12
    const master = ctx.createGain()
    master.gain.value = 0.55
    master.connect(comp).connect(ctx.destination)

    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    rig = { ctx, out: master, noise }
  }
  if (rig.ctx.state === 'suspended') void rig.ctx.resume()
  return rig
}

function envelope(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}

function saturator(ctx: AudioContext, amount: number) {
  const shaper = ctx.createWaveShaper()
  const n = 1024
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount)
  }
  shaper.curve = curve
  shaper.oversample = '2x'
  return shaper
}

/**
 * Start a group of sounds. Times are seconds from now, so a whole sequence
 * can be scheduled at once on the audio clock (tighter than timers).
 */
export function sfx() {
  const r = getRig()
  if (!r) return null
  const { ctx, out, noise } = r
  const at = (offset: number) => ctx.currentTime + 0.01 + offset

  return {
    /** "credit in": a quick three-note square-wave chime */
    start(offset = 0) {
      const t = at(offset)
      const osc = ctx.createOscillator()
      osc.type = 'square'
      ;[784, 1047, 1568].forEach((f, i) => osc.frequency.setValueAtTime(f, t + i * 0.055))
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 5200
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.004)
      g.gain.setValueAtTime(0.16, t + 0.11)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42)
      osc.connect(lp).connect(g).connect(out)
      osc.start(t)
      osc.stop(t + 0.45)
    },

    /** closed hi-hat; `open` rings a little longer */
    hat(offset = 0, velocity = 1, open = false) {
      const t = at(offset)
      const src = ctx.createBufferSource()
      src.buffer = noise
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 7200
      const peak = ctx.createBiquadFilter()
      peak.type = 'peaking'
      peak.frequency.value = 10500
      peak.gain.value = 6
      const g = ctx.createGain()
      envelope(g, t, 0.3 * velocity, 0.002, open ? 0.22 : 0.045)
      src.connect(hp).connect(peak).connect(g).connect(out)
      src.start(t, Math.random() * 0.5)
      src.stop(t + (open ? 0.3 : 0.08))
    },

    /** filtered-noise sweep up to the drop */
    riser(offset = 0, duration = 0.9) {
      const t = at(offset)
      const src = ctx.createBufferSource()
      src.buffer = noise
      src.loop = true
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.Q.value = 1.4
      bp.frequency.setValueAtTime(500, t)
      bp.frequency.exponentialRampToValueAtTime(7500, t + duration)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.09, t + duration * 0.9)
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.04)
      src.connect(bp).connect(g).connect(out)
      src.start(t)
      src.stop(t + duration + 0.06)
    },

    /** clap: three quick noise bursts and a short tail */
    clap(offset = 0) {
      const t = at(offset)
      const src = ctx.createBufferSource()
      src.buffer = noise
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 1400
      bp.Q.value = 0.9
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      ;[0, 0.011, 0.022].forEach(d => {
        g.gain.setValueAtTime(0.5, t + d)
        g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.009)
      })
      g.gain.setValueAtTime(0.32, t + 0.033)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24)
      src.connect(bp).connect(g).connect(out)
      src.start(t, Math.random() * 0.5)
      src.stop(t + 0.3)
    },

    /** the drop: a gritty 808 with a drill-style slide at the tail */
    boom(offset = 0) {
      const t = at(offset)
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(170, t)
      osc.frequency.exponentialRampToValueAtTime(52, t + 0.08)
      osc.frequency.setValueAtTime(52, t + 0.5)
      osc.frequency.exponentialRampToValueAtTime(40, t + 1.2)
      const drive = saturator(ctx, 2.6)
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 900
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.9, t + 0.006)
      g.gain.exponentialRampToValueAtTime(0.45, t + 0.4)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3)
      osc.connect(drive).connect(lp).connect(g).connect(out)
      osc.start(t)
      osc.stop(t + 1.35)

      // the click on top that makes it cut through small speakers
      const click = ctx.createOscillator()
      click.type = 'triangle'
      click.frequency.setValueAtTime(1800, t)
      click.frequency.exponentialRampToValueAtTime(200, t + 0.02)
      const cg = ctx.createGain()
      envelope(cg, t, 0.25, 0.001, 0.025)
      click.connect(cg).connect(out)
      click.start(t)
      click.stop(t + 0.05)
    }
  }
}
