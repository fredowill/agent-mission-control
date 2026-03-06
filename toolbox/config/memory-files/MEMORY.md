# MEMORY — phredomade

## Critical Rules (always follow)
- **MANDATORY**: Before saying "done", verify server on 3002 is `next dev` (not `next start`).
  Playwright spot-check the changed element. NEVER skip this.
- **Playwright visual verification is MANDATORY** — screenshot + critically evaluate the image.
  DOM assertions alone miss clipping, overflow, misalignment, wrong colors.
- After every implementation, run the localtest workflow automatically.
  Steps in `.claude/commands/localtest.md`.
- No auto-commit unless explicitly asked.
- Concise, systematic. Clarify before acting on ambiguous tasks.
- **One failure = measure, not retry.** See `principles.md` § How to Debug.
  Never iterate blindly — instrument, identify the layer, measure the gap, then fix.

## Project
Next.js 14 (App Router) photography portfolio. TypeScript strict. Tailwind CSS.
Working dir: `C:\Users\ephra\phredomade`. Branch: `main`. Dev port: `3002`.
**Status: LIVE** — deployed on Vercel at `phredomade.com`.

## Stack
- Next.js 14.2 / React 18 / TypeScript strict
- Three.js + React Three Fiber + postprocessing (3D/ASCII hero)
- GSAP + Motion (framer-motion fork) for animations
- Tailwind CSS — config in `tailwind.config.ts`
- Playwright installed (testing, not yet wired up to CI)

## Routing
- Public: `/portraits`, `/grad`, `/other`, `/contact`, `/book`, `/viewer`, `/grad-viewer`, `/other-viewer`
- `/` — production ASCII home page (config: `src/data/ascii-home.json`)
- `/poc/*` — **OUTDATED / DO NOT USE**. Internal testing only.
- `/admin` — token-protected via `middleware.ts` (ADMIN_TOKEN env var)

## Key Files
- `src/data/gallery.ts` + `gallery.json` — gallery source of truth
- `src/data/grad-booking-packages.json` — 4 tiers: Bronze $375 → Diamond $700
- `docs/PORTFOLIO_UPDATES.md` — how to add/update gallery images

## Booking API
- Route: `src/app/api/grad-booking-request/route.ts`
- Delivery: Resend email. Local fallback: `data/grad-booking-requests.ndjson`
- Has CSRF Origin guard + `packageName` validation
- Full guide: `.claude/agent-memory/BOOKING_SYSTEM_GUIDE.md`

## Env Vars (Vercel)
`ADMIN_TOKEN`, `RESEND_API_KEY`, `BOOKING_REQUEST_EMAIL_TO`,
`BOOKING_REQUEST_EMAIL_FROM`, `BOOKING_REQUEST_EMAIL_SUBJECT`,
`BOOKING_REQUEST_WEBHOOK_URL`

## Mission Control
- Dashboard: `.claude/agent-hub/server.js` → `http://localhost:3033`
- Pages: Dashboard, Dispatch, Findings, Workflow, Post-Mortems, Toolbox, Logic, Radar
- Hook: `hook.js` (PostToolUse + Stop) — writes state + activity log
- States: `.claude/agent-hub/states/{sessionId}.json`
- Logs: `.claude/agent-hub/logs/{sessionId}.ndjson`
- Missions: `.claude/agent-hub/missions.json`
- Design direction: Apple-inspired light mode PM tool (see `design-context.md`)
- **RENAME PENDING**: Directory is `agent-hub`, should be `mission-control`. GitHub repo is `agent-mission-control`. User calls it Mission Control. Rename when safe (will break paths in hooks, settings, MEMORY).
- **TWO GIT REPOS**: phredomade (main) tracks toolbox at `.claude/agents/`, `.claude/skills/`, `.claude/commands/`, `.claude/scripts/`, `.claude/settings.json`. Mission Control (`.claude/agent-hub/`) is a SEPARATE git repo (`fredowill/agent-mission-control`) tracking MC code + config data. Both need separate push/pull.
- **Home/Work toggle**: Mode stored in localStorage + mode.json. Dispatch, Dashboard, Toolbox, Findings all filter by mode. Workstreams have `context` field (null=shared, home, work).
- **CRITICAL PRINCIPLE (PM004)**: Before building any sync/transfer feature, audit git tracking FIRST. Run `git ls-files`, read `.gitignore`, verify transport layer before writing code.

## Deep Scrape Skill
- `/deep-scrape <url>` — reverse-engineers client-rendered components via Playwright
- Skill file: `.claude/commands/deep-scrape.md`

## Detailed Notes
See `principles.md` for **engineering principles** — how agents should think and act.
See `phredomade.md` for architecture deep-dive and known issues.
See `design-context.md` for aesthetic direction and Mission Control vision.
See `resend-setup.md` for Resend/email setup.
See `promo-video-pipeline.md` for Instagram video rendering pipeline.
See `security-audit.md` for security audit (2026-03-01) — 16 findings with checklist.
See `mcp-setup.md` for **MCP server installation on Windows** — cmd /c wrapper, CCLSP config, debugging.

## Server / Dev Workflow
- Hook `check-code-change.sh` fires after Edit/Write — warns if running prod build.
- Stale `.next` symptom: `Cannot find module './vendor-chunks/gsap.js'` → `rm -rf .next && npm run build`
- Port 3002 stuck: `netstat -ano | grep :3002` → `taskkill //PID <pid> //F`
- **Anti-rationalization hook** fires on every Stop event. Don't claim done without evidence.
- **If you skipped verification, say so.** The user would rather hear "I didn't test this" than a false "done."
