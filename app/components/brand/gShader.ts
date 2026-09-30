/* ---------------------------------------------------------------------------
   The G icon in liquid chrome, from the distance field in
   public/brand/g-sdf.png (scripts/build-g-icon.py).

   The G is a slab you can turn: `uSpin` rotates it about its vertical axis
   (a coin flip), so the face squeezes, its bevel catches the light as it
   turns and the edge of the slab shows. The same shader renders the static
   icon files (uTile = 1: on its rounded tile).
--------------------------------------------------------------------------- */

export const G_VERT = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

export const G_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uSdf;
uniform float uTexSize;   // texture size (px)
uniform vec2 uRes;        // canvas size (px)
uniform float uTime;
uniform vec2 uTilt;       // -1..1: lean toward the pointer
uniform vec3 uC0;         // brand gradient: cyan
uniform vec3 uC1;         //                 violet
uniform vec3 uC2;         //                 magenta
uniform float uBoot;      // 0 -> 1 materialise
uniform float uGlitch;    // 0 -> 1 glitch burst
uniform float uKick;      // beat envelope (0 when nothing plays)
uniform float uSpin;      // rotation about the vertical axis (radians)
uniform vec2 uDist;       // encoded distance range (texture px)
uniform float uTile;      // 0 none, 1 rounded tile, 2 full-bleed square
uniform float uFit;       // texture width as a fraction of the canvas

in vec2 vUv;
out vec4 fragColor;

const float DEPTH = 0.075;  // slab thickness, in texture uv

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// signed distance (texture px) at glyph uv, y up; far away outside
float sdfAt(vec2 q) {
  if (q.x < 0.0 || q.y < 0.0 || q.x > 1.0 || q.y > 1.0) return uDist.y;
  return mix(uDist.x, uDist.y, texture(uSdf, vec2(q.x, 1.0 - q.y)).r);
}

// chrome environment: tinted sky, hard dark horizon, glowing ground
vec3 chrome(float y, float x) {
  vec3 skyHi = mix(vec3(1.0), uC0, 0.3);
  vec3 skyLo = mix(uC0, uC1, 0.4) * 0.34 + 0.02;
  vec3 horizon = mix(vec3(0.015), uC1 * 0.35, 0.3);
  vec3 groundLo = mix(uC2, uC1, 0.35) * 0.5;
  vec3 groundHi = mix(uC2, vec3(1.0), 0.62);
  vec3 c;
  if (y > 0.54) {
    c = mix(skyHi, skyLo, smoothstep(0.56, 1.08, y));
  } else if (y > 0.46) {
    c = mix(horizon, skyHi, smoothstep(0.5, 0.545, y));
  } else {
    c = mix(groundHi, groundLo, smoothstep(0.0, 0.46, y));
    c = mix(c, horizon, smoothstep(0.39, 0.46, y));
  }
  // a faint iridescent drift between the brand's cyan and magenta
  float w = 0.5 + 0.5 * sin(x * 5.0 + y * 3.0 + uTime * 0.5);
  c += 0.07 * (mix(uC0, uC2, w) - 0.45);
  return c;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 uv = vUv;

  // --- boot: chunky pixels that pop in and resolve ------------------------
  float boot = clamp(uBoot, 0.0, 1.0);
  float eb = 1.0 - pow(1.0 - boot, 3.0);
  float block = mix(min(uRes.x, uRes.y) / 7.0, 1.0, eb);
  vec2 cell = floor(uv * uRes / block);
  if (block > 1.5) uv = (cell + 0.5) * block / uRes;
  float popped = step(hash(cell + 3.0), boot * 1.3);

  // --- glitch: displaced slices --------------------------------------------
  float band = floor(uv.y * 14.0);
  float r = hash(vec2(band, floor(uTime * 24.0)));
  uv.x += (r - 0.5) * 0.12 * uGlitch * step(0.6, r);

  // canvas -> texture space (square, centred)
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) / uFit;
  float texPerPx = uTexSize / (min(uRes.x, uRes.y) * uFit);

  // beat: a small bounce
  p /= 1.0 + 0.045 * uKick;

  // --- the slab, turned by uSpin + a lean toward the pointer ----------------
  float th = uSpin + uTilt.x * 0.42;
  float c = cos(th);
  float s = sin(th);
  // whichever face is toward us reads the right way round
  float fc = max(abs(c), 0.02);
  float fs = s * sign(c + 1e-5);
  // lean forward / back with the pointer: foreshorten vertically
  float pitch = uTilt.y * 0.28;
  float cp = cos(pitch);
  vec2 face = vec2((p.x - 0.5 * DEPTH * fs) / fc, p.y / cp) + 0.5;

  float ca = 0.0015 + 0.012 * uGlitch;
  float d = sdfAt(face);
  float dR = sdfAt(face + vec2(ca, 0.0));
  float dB = sdfAt(face - vec2(ca, 0.0));
  float aa = max(0.7, texPerPx * 0.9) / max(fc, 0.12);
  float cover = 1.0 - smoothstep(-aa, aa, d);
  float coverR = 1.0 - smoothstep(-aa, aa, dR);
  float coverB = 1.0 - smoothstep(-aa, aa, dB);

  // edge of the slab: the glyph swept through its thickness
  float side = 1e5;
  if (abs(s) > 0.01) {
    for (int k = 0; k <= 8; k++) {
      float z = (float(k) / 8.0 - 0.5) * DEPTH;
      vec2 q = vec2((p.x - z * fs) / fc, p.y / cp) + 0.5;
      side = min(side, sdfAt(q));
    }
  }
  float sideCover = (1.0 - smoothstep(-aa, aa, side)) * (1.0 - cover);

  // --- bevelled chrome face -------------------------------------------------
  float bevel = 16.0;
  float x = clamp(-d / bevel, 0.0, 1.0);
  float slope = 2.0 * (1.0 - x);
  vec2 e = vec2(2.0 / uTexSize, 0.0);
  vec2 g = vec2(sdfAt(face + e.xy) - sdfAt(face - e.xy), sdfAt(face + e.yx) - sdfAt(face - e.yx));
  vec2 n2 = length(g) > 1e-4 ? normalize(g) : vec2(0.0);
  vec3 n = normalize(vec3(n2 * slope * 0.95, 1.0));
  // turn the normal with the slab
  n = vec3(n.x * fc + n.z * fs, n.y * cp + n.z * sin(pitch), -n.x * fs + n.z * fc);

  float gy = clamp((face.y - 0.19) / 0.62, 0.0, 1.0);   // 0 bottom .. 1 top of the G
  float gx = clamp((face.x - 0.18) / 0.64, 0.0, 1.0);
  vec3 col = chrome(gy + n.y * 0.45 + uTilt.y * 0.06, gx + n.x * 0.35);

  // a sheen that sweeps across now and then, and whenever the slab turns
  float sweep = fract(uTime * 0.11) * 2.2 - 0.6 + s * 0.8 + uTilt.x * 0.15;
  float sheen = pow(max(0.0, 1.0 - abs((gx - gy * 0.35) - sweep) * 5.0), 3.0);
  col += sheen * 0.6;

  // rim light in the brand gradient
  float rim = (1.0 - smoothstep(0.0, 0.5, x)) * cover;
  col += mix(uC0, uC2, 1.0 - gy) * rim * 0.38;

  // beat: brighter on the kick; scanlines
  col *= 1.0 + 0.25 * uKick;
  col *= 0.96 + 0.04 * sin(gl_FragCoord.y * 1.7);

  // the slab's edge: dark metal picking up the brand colours
  float lit = 0.35 + 0.65 * abs(s);
  vec3 sideCol = mix(mix(uC2, uC1, 0.4), mix(uC0, vec3(1.0), 0.2), gy) * (0.18 + 0.4 * lit);
  sideCol += pow(max(0.0, 1.0 - abs(gy - 0.52) * 7.0), 2.0) * 0.25;

  // --- glow ----------------------------------------------------------------
  float gd = max(min(d, side), 0.0);
  float gw = 22.0 + 12.0 * uKick;
  float glow = max(exp(-gd / gw) - exp(-uDist.y * 0.8 / gw), 0.0) * (0.34 + 0.5 * uKick);
  vec3 glowCol = mix(uC0, uC2, smoothstep(0.15, 0.85, 1.0 - vUv.y + vUv.x * 0.3));

  // compose (premultiplied)
  vec3 face3 = vec3(col.r * coverR, col.g * cover, col.b * coverB);
  float a = max(max(coverR, cover), coverB);
  vec3 outc = face3 + sideCol * sideCover;
  float outa = a + sideCover * (1.0 - a);
  outc += glowCol * glow * (1.0 - outa);
  outa += glow * (1.0 - outa);

  // --- tile, for the icon files ------------------------------------------------
  if (uTile > 0.5) {
    vec2 t = (vUv - 0.5) * vec2(aspect, 1.0);
    float rad = uTile > 1.5 ? 0.0 : 0.225;
    vec2 qd = abs(t) - vec2(0.5 - rad);
    float td = length(max(qd, 0.0)) + min(max(qd.x, qd.y), 0.0) - rad;
    float tpx = 1.0 / min(uRes.x, uRes.y);
    float inTile = uTile > 1.5 ? 1.0 : 1.0 - smoothstep(-tpx, tpx, td);
    vec3 bg = mix(vec3(0.102, 0.09, 0.141), vec3(0.027, 0.024, 0.039), smoothstep(0.0, 0.75, length(t - vec2(0.0, 0.22))));
    // faint LED grid, like the site
    vec2 lc = fract((vUv - 0.5) * 30.0) - 0.5;
    float led = 1.0 - smoothstep(0.15, 0.2, max(abs(lc.x), abs(lc.y)));
    bg += led * 0.022;
    // hairline rim
    float rimT = uTile > 1.5 ? 0.0 : (1.0 - smoothstep(0.0, tpx * 3.0, abs(td + tpx * 2.0))) * (0.1 + 0.08 * smoothstep(0.0, 0.5, t.y));
    bg += rimT;
    vec3 composed = outc + bg * (1.0 - outa);
    fragColor = vec4(composed * inTile, inTile);
    return;
  }

  // boot flash + scan
  float flash = (1.0 - eb) * 0.8;
  outc = mix(outc, vec3(outa), flash * 0.6);
  float scan = (1.0 - smoothstep(0.0, 0.02, abs(vUv.y - (1.0 - boot)))) * (1.0 - boot);
  outc += scan * uC0 * 0.6;
  outa = max(outa, scan * 0.6);
  fragColor = vec4(outc * popped, outa * popped);
}
`
