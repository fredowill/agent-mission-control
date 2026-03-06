You are entering local testing state for the phredomade project.
Perform the following checks in order, report each result clearly.

---

## Step 1 — Read P0 working memory
Read `memory/P0-working-memory.md` from the auto-memory directory at:
`C:\Users\ephra\.claude\projects\C--Users-ephra-phredomade\memory\P0-working-memory.md`

Summarise any open 🔴 P0 items and 🟠 watch items in one sentence each.
Note the "Last Session — Changes Made" section so you know what changed recently.

---

## Step 2 — Verify server mode

Run: `netstat -ano | grep :3002`

Get the listening PID, then check its command line:
`powershell -Command "(Get-WmiObject Win32_Process -Filter 'ProcessId=<PID>').CommandLine"`
And check its parent:
`powershell -Command "(Get-WmiObject Win32_Process -Filter 'ProcessId=<PARENT_PID>').CommandLine"`

**Outcome A — `next dev` found:** Report ✅ DEV mode, HMR active.
**Outcome B — `next start` / no dev flag:**
- Kill the stale PID: `taskkill //PID <pid> //F`
- Restart dev server in background: `npm run dev` (use run_in_background: true)
- Poll until `curl -s -o /dev/null -w "%{http_code}" http://localhost:3002` returns 200
- Report ✅ Restarted in dev mode.
**Outcome C — port not bound:**
- Start dev: `npm run dev` (run_in_background: true), poll for 200, report.

---

## Step 3 — Playwright DOM spot-checks

Run the following Node.js Playwright script to check key DOM state.
Save to a temp file and run with node, or use `-e`. Working dir: `C:\Users\ephra\phredomade`.

```js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();

  // Gallery image priority
  await p.goto('http://localhost:3002/gallery/portraits', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  const imgs = await p.$$('.gallery-masonry img');
  if (imgs.length > 0) {
    const loading = await imgs[0].getAttribute('loading');
    const fp      = await imgs[0].getAttribute('fetchpriority');
    console.log(`[gallery] first img — loading=${loading}, fetchpriority=${fp}`);
    console.log(`[gallery] img count: ${imgs.length}`);
    // Check image 8+ is lazy
    if (imgs.length > 8) {
      const lazyLoading = await imgs[8].getAttribute('loading');
      console.log(`[gallery] img[8] loading=${lazyLoading} (expect lazy)`);
    }
  } else {
    console.log('[gallery] WARNING: no images found in .gallery-masonry');
  }

  // Check transition overlay element exists
  await p.goto('http://localhost:3002/', { waitUntil: 'domcontentloaded' });
  const overlay  = await p.$('.poc-transition');
  const curtain  = await p.$('.poc-transition__curtain');
  console.log(`[transition] .poc-transition present: ${!!overlay}`);
  console.log(`[transition] .poc-transition__curtain present: ${!!curtain}`);

  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
```

Report each `console.log` line verbatim.

**Expected passing values:**
- `loading=eager`, `fetchpriority=high` on first image
- `img[8] loading=lazy`
- Both transition elements present

---

## Step 4 — Report manual test checklist

Print the following checklist for the user to work through in their browser at `http://localhost:3002`:

### Gallery loading
- [ ] Open `http://localhost:3002/gallery/portraits`
- [ ] DevTools → Network → Img tab, sort by Priority — first 4 images show **Highest**, images 5–8 show **High**
- [ ] On Slow 3G throttle: images fade in individually (no pop), masonry columns hold shape while loading

### Page transition — exit
- [ ] Click any gallery nav link (e.g. Portraits → Grad)
- [ ] Curtain should take ~1.15s to sweep across (was ~0.95s) — noticeably slower

### Page transition — reveal (enter)
- [ ] After navigation completes, curtain should slide off to the **right** over ~0.7s before gallery appears
- [ ] Previously the new page just popped in instantly — this should now feel like a smooth wipe reveal

### Edge cases
- [ ] Hard refresh (`Ctrl+Shift+R`) on any gallery page — page appears instantly, no curtain flash
- [ ] Resize to mobile width (< 769px) then navigate — no curtain on enter, just instant page swap
- [ ] Enable "prefers-reduced-motion" in DevTools → Rendering — no curtain animations at all

---

## Step 5 — Final status line

End with a single line:
`✅ Local test state ready — server on :3002 (dev), DOM verified, checklist above.`
or
`⚠ Issues found: <list>` if any check failed.
