# phredomade — Architecture & Known Issues

## Gallery Architecture
- Gallery data: `src/data/gallery.ts` imports `gallery.json`
- Sections: `portraits` (42 imgs), `grad` (34 imgs), `other` (25 imgs)
- Images served from `public/gallery/{section}/` as static JPGs
- Grid → Viewer deep link: `/viewer?slide=N` (1-indexed)
- GalleryViewer clamps initial slide: `Math.max(1, Math.min(initialSlide, items.length))`
- Masonry layout: CSS `grid-auto-rows: 1px` + dynamic row-span via ResizeObserver

## Image Loading (Performance Issue — Fixed in pre-publish sprint)
- **Problem**: GalleryGrid fired all 40 requests simultaneously → random load order + masonry thrash
- **Fix applied**: Added `loading="lazy"` + `decoding="async"` to `<motion.img>` in GalleryGrid
- **Viewer**: Already uses `loading="eager"` + `fetchPriority="high"` on current slide
- **Adjacent preload**: Added hidden `<img>` for prev/next slides in GalleryViewer

## Mobile UI
- Mobile breakpoint: ≤768px (Tailwind `lg:` = 1024px for sidebar)
- Viewer close button: 42×42px circle, fixed `top:14px right:14px` on mobile
- Close glyph `×` uses flex centering (fixed fragile translateY offset in pre-publish sprint)
- Swipe threshold: 34px horizontal; tap zone: left 38% = prev, else next
- `ignoreNextClickRef` prevents double-advance after swipe

## ASCII Hero / Contact
- AsciiEffect uses WebGL shader: `src/components/ascii/ascii-shader.glsl`
- Contact page renders ASCII panel with parallax input
- Mobile: touch-mode auto-detected, parallax uses touch events
- Config: `src/data/contact-ascii.json` (layout parameters)

## Admin Panel
- Protected by `middleware.ts` at root — checks ADMIN_TOKEN in query/header/cookie
- Can edit: about page content, gallery items, booking packages
- POST APIs (about, gallery, packages) are dev-only: 403 in production

## Booking Flow
- Page at `/book` (re-exported from `src/app/(poc)/poc/gallery/book/page.tsx`)
- 4 packages: Bronze $375 / Silver $450 / Gold $600 / Diamond $700
- Required: fullName, email, preferredDate. Phone, school, etc. optional.
- Server validation in API: email regex, date parse, trim checks
- Success state: green message + UUID reference ID

## Known Lint/Build Notes
- Run `npm run lint` before every deploy — Next.js ESLint config
- Run `npm run build` to catch type errors
- `next.config.js` is intentionally minimal (default config)

## Pre-Publish Sprint (2026-02) — Changes Made
1. Replaced lorem ipsum + `hello@example.com` in DEFAULT_ABOUT / FALLBACK_ABOUT fallbacks
2. Fixed 3x `hello@example.com` in admin page → `ephratah@phredomade.com`
3. Fixed mobile viewer close button: flex centering, normalized font-size to 20px
4. Added `loading="lazy"` + `decoding="async"` to GalleryGrid `<motion.img>`
5. Added adjacent slide preloading to GalleryViewer
6. Added `data/grad-booking-requests.ndjson` to .gitignore
7. Updated PRE_PUBLISHING_STATUS.md with Resend env var details
