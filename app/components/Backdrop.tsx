'use client'

import { useContext, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'
import { PlayBarContext } from '../providers/PlayBarProvider'

/**
 * LED-matrix aurora. The original aurora shader, sampled once per cell and
 * drawn as rounded LEDs, so the whole site sits on a pad/pixel grid.
 * Mounted once in the root layout: it cross-fades between route palettes and
 * gets more energetic while something is playing.
 */

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

  // a few LEDs blink on their own; more of them while music plays
  float r = hash21(cellId);
  float blink = step(0.992 - uEnergy * 0.012, fract(r * 7.0 + uTime * (0.03 + r * 0.05)));
  level = max(level, blink * 0.5 * smoothstep(0.3, 0.95, uv.y));

  // quantise brightness into LED steps
  level = floor(level * 5.0 + 0.5) / 5.0;
  level *= 0.8 + uEnergy * 0.4;

  // rounded-square LED inside its cell
  vec2 p = gl_FragCoord.xy / uCell - cellId - 0.5;
  float size = 0.24 + 0.1 * clamp(level, 0.0, 1.0);
  float rad = 0.09;
  vec2 q = abs(p) - vec2(size - rad);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad;
  float aa = 1.2 / uCell;
  float shape = 1.0 - smoothstep(-aa, aa, d);

  // faint unlit panel so the grid reads where the aurora isn't
  float base = 0.04 * smoothstep(0.1, 1.0, uv.y);
  vec3 col = ramp(uv.x) * level + vec3(base);
  float alpha = shape * clamp(level + base, 0.0, 1.0);
  fragColor = vec4(col * shape, alpha);
}
`

type Palette = [string, string, string]

const PALETTES: Record<string, Palette> = {
  home: ['#FF3448', '#8C2BFF', '#3BE7FF'],
  studio: ['#FF3448', '#FF7A2E', '#3BE7FF'],
  spotify: ['#1ED760', '#0FB5A0', '#3BE7FF'],
  about: ['#A78BFA', '#FF3448', '#FF8A2A'],
  tech: ['#3BE7FF', '#5B7CFF', '#A78BFA'],
  lost: ['#FF3448', '#B3122A', '#FF5C6A']
}

function paletteFor(pathname: string): Palette {
  if (pathname === '/') return PALETTES.home
  if (pathname.startsWith('/studio')) return PALETTES.studio
  if (pathname.startsWith('/spotify')) return PALETTES.spotify
  if (pathname.startsWith('/about')) return PALETTES.about
  if (pathname.startsWith('/tech')) return PALETTES.tech
  return PALETTES.lost
}

const toRgb = (hex: string) => {
  const c = new Color(hex)
  return [c.r, c.g, c.b]
}

export function Backdrop() {
  const pathname = usePathname()
  const { isPlaying } = useContext(PlayBarContext)
  const host = useRef<HTMLDivElement>(null)
  const target = useRef(paletteFor(pathname).map(toRgb))
  const playing = useRef(isPlaying)

  useEffect(() => {
    target.current = paletteFor(pathname).map(toRgb)
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
        uCell: { value: 8 * dpr }
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

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      const minStep = reduce.matches ? 100 : 1000 / 30
      if (t - last < minStep) return
      const dt = Math.min((t - (last || t)) / 1000, 0.1)
      last = t

      energy += ((playing.current ? 1 : 0) - energy) * 0.06
      if (!reduce.matches) clock += dt * (0.32 + energy * 0.38)

      const goal = target.current
      for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
          colors[i][k] += (goal[i][k] - colors[i][k]) * 0.07
        }
      }

      program.uniforms.uTime.value = clock
      program.uniforms.uEnergy.value = energy
      program.uniforms.uAmplitude.value = 1 + energy * 0.45
      program.uniforms.uColorStops.value = colors
      renderer.render({ scene: mesh })
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      if (gl.canvas.parentNode === el) el.removeChild(gl.canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return (
    <div
      ref={host}
      aria-hidden
      className='pointer-events-none fixed inset-0 z-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,black_30%,transparent_88%)]'
    />
  )
}
