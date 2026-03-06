# Promo Video Rendering Pipeline

## Overview
Instagram promo videos for phredomade.com. Two formats:
- **Stories** (2:3, 1080x1620) — in `promo/story/`
- **Posts** (4:5, 1080x1350) — in `promo/post/`

## ffmpeg location
```bash
FFMPEG=$(node -e "process.stdout.write(require('ffmpeg-static'))")
```

## Key principle: output at 30fps
Raw sources are 60fps. Output at **30fps** (not 25fps) for clean 2:1 frame selection. 25fps from 60fps = 2.4x = uneven cadence = choppy.

## Raw source files (in `promo/`)
- `temp-home-raw.mp4` — 1040x1040, 60fps, home page with card (desktop layout at 1040px viewport)
- `temp-home-raw-clean.mp4` — 1040x1040, 30fps, home page ASCII only (card hidden via CSS injection during recording)
- `temp-book-raw-desktop.mp4` — 1040x650, 60fps, grad booking page static
- `temp-book-scroll-raw.mp4` — 1040x650, 60fps, grad booking page with auto-scroll

## Overlay system
1. **HTML overlays** — source of truth for text/graphics
2. **PNG overlays** — rendered from HTML via Playwright `page.screenshot({ omitBackground: true })`
3. **MOV overlays** — for animated elements (globe), rendered frame-by-frame via Playwright, assembled with `ffmpeg -c:v qtrle -pix_fmt argb`

## Rendering animated overlays (frame-by-frame approach)
For animated elements that need alpha transparency:

1. Create HTML with animation controlled by `window.setFrame(frameNum)` function
2. Capture each frame with Playwright:
```js
for (let i = 0; i < totalFrames; i++) {
  await page.evaluate(({ f }) => window.setFrame(f), { f: i });
  await page.waitForTimeout(8);
  const buf = await page.screenshot({ omitBackground: true });
  writeFileSync(`frame-${String(i).padStart(5, '0')}.png`, buf);
}
```
3. Assemble into alpha video:
```bash
$FFMPEG -y -framerate 30 -i "frame-%05d.png" -c:v qtrle -pix_fmt argb output.mov
```

## Filter files (in `promo/`)
Filters use `-filter_complex_script <file>` to avoid shell escaping issues with geq expressions.

### Rounded corners via geq
The geq alpha mask creates rounded rect corners. For a 1040x1040 video with 20px radius:
```
[1:v]format=yuva420p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='if(gt(abs(X-520),520-20)*gt(abs(Y-520),520-20),if(lte(hypot(abs(X-520)-(520-20),abs(Y-520)-(520-20)),20),255,0),255)'[rounded]
```
**CRITICAL**: Must include `cb='cb(X,Y)':cr='cr(X,Y)'` or you get green/magenta color corruption.

### Filter input mapping
- `[0:v]` = background canvas (lavfi color source)
- `[1:v]` = screen recording video
- `[2:v]` = top text overlay PNG (looped)
- `[3:v]` = bottom overlay (PNG or animated MOV)

### Key filter files
- `filter-white.txt` / `filter-dark.txt` — story home (white/black bg)
- `filter-grad.txt` — story grad
- `filter-post-home-anim.txt` — post home (with @phredomade fade-in bottom)
- `filter-post-grad-globe-anim.txt` — post grad (with animated globe bottom)

## Full render command example (post with animated overlay)
```bash
$FFMPEG -y \
  -f lavfi -i "color=c=white:s=1080x1350:r=30:d=11.97" \
  -i temp-book-scroll-raw.mp4 \
  -loop 1 -i overlay-post-grad-top.png \
  -i overlay-post-grad-bottom-anim.mov \
  -filter_complex_script filter-post-grad-globe-anim.txt \
  -map "[out]" -r 30 -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -an \
  -t 11.97 post/grad-scroll.mp4
```

## Recording new screen captures
Use Playwright CDP screencast for smooth 60fps recordings:
- Mobile viewport (≤768px width) for ASCII-only home (hides desktop nav)
- Inject CSS to hide `.poc-card` and `.pointer-events-auto` for card-free recording
- `hasTouch: true` in browser context to trigger mobile mode (900px JS breakpoint)

## Preview animated elements
`public/globe-test.html` — live preview of spinning globe + video layout. Accessible at `http://localhost:3002/globe-test.html` or LAN IP.

## Text content (current)
- Home: "Now live." / "Class of '26 grad bookings now open / Browse work & book a session"
- Grad: "Class of '26 bookings are open." / "Grad sessions now available"
