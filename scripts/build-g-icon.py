"""Build the G icon's distance field.

The G is the G of the GAMEOVER title, redrawn with clean geometry
(90 x 88 units, 18-unit stroke):

    outer: left half-circle r=44 about (44,44), flat top/bottom to x=90
    inner: left half-circle r=26, arms 18 thick
    crossbar y 36..53 from x=44 to 90, right leg x 72..90 from y=36 down

Writes public/brand/g-sdf.png: signed distance (negative inside), encoded
in red over DIST_MIN..DIST_MAX texture px, glyph centred with room for the
glow. The shader (app/components/brand/gShader.ts) reads it. Run from the
repo root:  python3 scripts/build-g-icon.py
"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

OUT = 512                 # texture size
SPAN = 142.0              # glyph units across the texture (90 + glow room)
SS = 4                    # supersampling for the distance transform
DIST_MIN, DIST_MAX = -12.0, 26.0   # units encoded in the texture

N = OUT * SS
u = (np.arange(N) + 0.5) / N * SPAN - SPAN / 2 + 45.0   # glyph x
v = (np.arange(N) + 0.5) / N * SPAN - SPAN / 2 + 44.0   # glyph y (down)
X, Y = np.meshgrid(u, v)

r = np.hypot(X - 44, Y - 44)
bowl = (X <= 44) & (r >= 26) & (r <= 44)
top = (X >= 44) & (X <= 90) & (Y >= 0) & (Y <= 18)
bottom = (X >= 44) & (X <= 90) & (Y >= 70) & (Y <= 88)
leg = (X >= 72) & (X <= 90) & (Y >= 36) & (Y <= 88)
bar = (X >= 44) & (X <= 90) & (Y >= 36) & (Y <= 53)
mask = bowl | top | bottom | leg | bar

px = SPAN / N  # units per supersampled pixel
d_out = ndi.distance_transform_edt(~mask) * px
d_in = ndi.distance_transform_edt(mask) * px
sdf = np.where(mask, -(d_in - px / 2), d_out - px / 2)

# downsample by averaging SSxSS blocks (distance fields average well)
sdf = sdf.reshape(OUT, SS, OUT, SS).mean(axis=(1, 3))
enc = np.clip((sdf - DIST_MIN) / (DIST_MAX - DIST_MIN), 0, 1)
img = Image.fromarray((enc * 255).round().astype(np.uint8), 'L')
img.save('public/brand/g-sdf.png', optimize=True)

meta = {
    'size': OUT,
    # distances in texture px
    'distMin': round(DIST_MIN * OUT / SPAN, 4),
    'distMax': round(DIST_MAX * OUT / SPAN, 4),
    # glyph box in texture uv (0..1), for layout
    'glyph': [round((0 - 45 + SPAN / 2) / SPAN, 5), round((0 - 44 + SPAN / 2) / SPAN, 5),
              round((90 - 45 + SPAN / 2) / SPAN, 5), round((88 - 44 + SPAN / 2) / SPAN, 5)],
    'unitsPerTexel': round(SPAN / OUT, 5),
}
print(json.dumps(meta))
