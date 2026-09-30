'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'
import { useIsPlaying } from '../providers/PlayBarProvider'
import { cn } from '@/lib/utils'
import { THEMES, themeFor } from '@/lib/theme'
import { readBeat } from '@/lib/beatClock'
import { HIT_EVENT } from '@/lib/stage'

/**
 * LED-matrix aurora. The original aurora shader, sampled once per cell and
 * drawn as rounded LEDs, so the whole site sits on a pad/pixel grid.
 * Mounted once in the root layout: it cross-fades between route palettes,
 * gets more energetic while something is playing, pumps with the kick of
 * the beat that's on, and ripples out from every click.
 */

const MAX_RIPPLES = 4
const RIPPLE_LIFE = 1.1 // seconds

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
uniform float uEnergy;
uniform float uCell;
uniform float uIntensity;
uniform float uKick;
uniform float uHat;
uniform vec4 uRipples[4]; // centre (px), radius (px), strength

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 ramp(float f) {
  f = clamp(f, 0.0, 1.0);
  return f < 0.5
    ? mix(uColorStops[0], uColorStops[1], f * 2.0)
    : mix(uColorStops[1], uColorStops[2], (f - 0.5) * 2.0);
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 cellId = floor(gl_FragCoord.xy / uCell);
  vec2 uv = (cellId + 0.5) * uCell / uResolution;

  // aurora height field (same as the original shader), sampled per LED
  float n = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  float h = uv.y * 2.0 - exp(n) + 0.2;
  float intensity = 0.6 * h;
  float a = smoothstep(0.2 - uBlend * 0.5, 0.2 + uBlend * 0.5, intensity);
  float level = clamp(intensity * a, 0.0, 1.0);

  // a few LEDs blink on their own; more while music plays, and a fresh
  // scatter on every hi-hat
  float r = hash21(cellId);
  float blink = step(0.992 - uEnergy * 0.012 - uHat * 0.006, fract(r * 7.0 + uTime * (0.03 + r * 0.05)));
  level = max(level, blink * 0.5 * smoothstep(0.3, 0.95, uv.y));

  // quantise brightness into LED steps
  level = floor(level * 5.0 + 0.5) / 5.0;
  level *= 0.8 + uEnergy * 0.4;
  // the kick pumps the whole panel
  level *= 1.0 + 0.55 * uKick;

  // rings of light spreading from clicks
  vec2 cellPx = (cellId + 0.5) * uCell;
  float ripple = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 rp = uRipples[i];
    if (rp.w <= 0.0) continue;
    float ring = abs(length(cellPx - rp.xy) - rp.z);
    ripple = max(ripple, rp.w * (1.0 - smoothstep(0.0, uCell * 2.4, ring)));
  }
  ripple = floor(ripple * 4.0 + 0.5) / 4.0;
  level = max(level, ripple);

  // rounded-square LED inside its cell
  vec2 p = gl_FragCoord.xy / uCell - cellId - 0.5;
  float size = 0.24 + 0.1 * clamp(level, 0.0, 1.0) + 0.04 * uKick;
  float rad = 0.09;
  vec2 q = abs(p) - vec2(size - rad);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad;
  float aa = 1.2 / uCell;
  float shape = 1.0 - smoothstep(-aa, aa, d);

  // faint unlit panel so the grid reads where the aurora isn't
  float base = 0.04 * smoothstep(0.1, 1.0, uv.y);
  vec3 col = ramp(uv.x) * level + vec3(base);
  col = mix(col, ramp(uv.x) * 0.8 + 0.25, ripple * 0.6);
  float alpha = shape * clamp(level + base, 0.0, 1.0);
  // premultiplied alpha: scale colour and coverage together; ripples stay
  // bright even where the panel is dimmed behind content
  fragColor = vec4(col * shape, alpha) * max(uIntensity, ripple * 0.85);
}
`

// each section keeps its own colours (lib/theme.ts)
const paletteFor = (pathname: string) => THEMES[themeFor(pathname)].stops

const toRgb = (hex: string) => {
  const c = new Color(hex)
  return [c.r, c.g, c.b]
}

export function Backdrop() {
  const pathname = usePathname()
  const isPlaying = useIsPlaying()
  const host = useRef<HTMLDivElement>(null)
  const target = useRef(paletteFor(pathname).map(toRgb))
  const playing = useRef(isPlaying)
  const home = pathname === '/'
  const onHome = useRef(home)

  useEffect(() => {
    target.current = paletteFor(pathname).map(toRgb)
    onHome.current = pathname === '/'
  }, [pathname])

  useEffect(() => {
    playing.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    const el = host.current
    if (!el) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let renderer: Renderer
    try {
      renderer = new Renderer({
        dpr,
        alpha: true,
        premultipliedAlpha: true,
        antialias: false
      })
    } catch {
      return // no WebGL: the page still has its ink background
    }
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.canvas.style.display = 'block'

    const geometry = new Triangle(gl)
    if (geometry.attributes.uv) delete geometry.attributes.uv

    const colors = target.current.map(c => [...c])
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 1 },
        uColorStops: { value: colors },
        uResolution: { value: [1, 1] },
        uBlend: { value: 0.6 },
        uEnergy: { value: 0 },
        uCell: { value: 8 * dpr },
        uIntensity: { value: 1 },
        uKick: { value: 0 },
        uHat: { value: 0 },
        // an array of vec4s (ogl only matches plain arrays to uniform arrays)
        uRipples: {
          value: Array.from({ length: MAX_RIPPLES }, () => [0, 0, 0, 0])
        }
      }
    })
    const mesh = new Mesh(gl, { geometry, program })
    el.appendChild(gl.canvas)

    const resize = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      renderer.setSize(w, h)
      program.uniforms.uResolution.value = [w * dpr, h * dpr]
      program.uniforms.uCell.value = (w < 640 ? 7 : 8) * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let last = 0
    let clock = 12 // start mid-flow so the first frame isn't flat
    let energy = 0
    let intensity = onHome.current ? 1 : 0.6

    // click ripples, in canvas pixels (origin bottom-left, like the shader)
    const ripples: Array<{ x: number; y: number; born: number; power: number }> = []
    const rippleData = program.uniforms.uRipples.value as number[][]
    const addRipple = (clientX: number, clientY: number, power = 1) => {
      if (reduce.matches) return
      ripples.push({
        x: clientX * dpr,
        y: (el.offsetHeight - clientY) * dpr,
        born: performance.now(),
        power
      })
      if (ripples.length > MAX_RIPPLES) ripples.shift()
    }
    // clicks (not pointerdown: touching to scroll shouldn't ripple);
    // keyboard clicks come from the middle of whatever was activated
    const onClick = (e: MouseEvent) => {
      if (e.detail === 0 && e.target instanceof Element) {
        const r = e.target.getBoundingClientRect()
        addRipple(r.left + r.width / 2, r.top + r.height / 2)
      } else {
        addRipple(e.clientX, e.clientY)
      }
    }
    // anything can send one: window.dispatchEvent(new CustomEvent(HIT_EVENT, { detail: { x, y } }))
    const onHit = (e: Event) => {
      const d = (e as CustomEvent<{ x?: number; y?: number; power?: number }>).detail
      addRipple(d?.x ?? el.offsetWidth / 2, d?.y ?? el.offsetHeight / 2, d?.power ?? 1)
    }
    window.addEventListener('click', onClick, { capture: true, passive: true })
    window.addEventListener(HIT_EVENT, onHit)

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      const minStep = reduce.matches ? 100 : 1000 / 30
      if (t - last < minStep) return
      const dt = Math.min((t - (last || t)) / 1000, 0.1)
      last = t

      // the Konami code (CheatCodes) turns the wall up to full
      const party = document.documentElement.dataset.cheat !== undefined
      energy += ((playing.current || party ? 1 : 0) - energy) * 0.06
      if (!reduce.matches) clock += dt * (0.32 + energy * 0.38)

      // full strength at the top of the landing page; calmer behind content
      // once you scroll, and on reading-heavy pages
      const depth = Math.min(1, window.scrollY / (window.innerHeight * 0.9))
      const goalIntensity = party ? 1 : (onHome.current ? 1 : 0.6) * (1 - 0.62 * depth)
      intensity += (goalIntensity - intensity) * 0.12
      program.uniforms.uIntensity.value = intensity

      const goal = target.current
      for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
          colors[i][k] += (goal[i][k] - colors[i][k]) * 0.07
        }
      }

      // the beat that's playing (silent while paused or on Spotify tracks)
      const beat = reduce.matches ? null : readBeat()
      program.uniforms.uKick.value = beat?.playing ? beat.kick : 0
      program.uniforms.uHat.value = beat?.playing ? beat.hat : 0

      for (let i = ripples.length - 1; i >= 0; i--) {
        const age = (t - ripples[i].born) / 1000
        if (age > RIPPLE_LIFE) ripples.splice(i, 1)
      }
      for (let i = 0; i < MAX_RIPPLES; i++) {
        const rp = ripples[i]
        const slot = rippleData[i]
        if (!rp) {
          slot[3] = 0
          continue
        }
        const k = (t - rp.born) / 1000 / RIPPLE_LIFE
        slot[0] = rp.x
        slot[1] = rp.y
        slot[2] = (1 - Math.pow(1 - Math.min(k * 1.6, 1), 2)) * 520 * dpr * rp.power
        slot[3] = rp.power * (1 - k) * (1 - k)
      }

      program.uniforms.uTime.value = clock
      program.uniforms.uEnergy.value = energy
      program.uniforms.uAmplitude.value = 1 + energy * 0.45
      program.uniforms.uColorStops.value = colors
      // nothing to draw while a stage transition covers the screen
      if (document.documentElement.dataset.stageCovered === undefined) {
        renderer.render({ scene: mesh })
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('click', onClick, { capture: true })
      window.removeEventListener(HIT_EVENT, onHit)
      if (gl.canvas.parentNode === el) el.removeChild(gl.canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return (
    <div
      ref={host}
      aria-hidden
      data-backdrop
      className={cn(
        'pointer-events-none fixed inset-0 z-0 opacity-75',
        home
          ? '[mask-image:linear-gradient(to_bottom,black,black_30%,transparent_88%)]'
          : '[mask-image:linear-gradient(to_bottom,black,black_18%,transparent_62%)]'
      )}
    />
  )
}
