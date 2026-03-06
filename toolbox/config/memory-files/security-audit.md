# Security Audit — phredomade (2026-03-01)

## Status Key
- [ ] Not started
- [x] Fixed

---

## CRITICAL

### 1. Weak Admin Token
- [ ] **Fix:** Replace `ephratahadminkey` with `openssl rand -base64 32` output. Update in Vercel env vars.
- **Why:** Only credential protecting admin panel. Short, guessable, dictionary words. Combined with non-functional rate limiter = brute-forceable.

---

## HIGH

### 2. ADMIN_TOKEN Embedded in Email URLs
- [ ] **File:** `src/app/api/booking/[token]/claim-zelle/route.ts:66-67`
- **Why:** Raw admin token in Zelle notification email URL. Persists in Resend logs, inbox history, browser history, referrer headers.
- **Fix:** Link to `/admin/bookings` without token. Admin already has cookie auth.

### 3. ADMIN_TOKEN Logged on Auth Failure
- [ ] **File:** `src/app/api/admin/bookings/[id]/confirm-zelle/route.ts:21`
- **Why:** `console.error` prints expected token value to Vercel runtime logs on every failed auth attempt.
- **Fix:** Log only `!!cookie` and `!!header`, never the expected value.

### 4. No Security Headers
- [ ] **File:** `next.config.js`
- **Why:** Config is `{}`. No CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Enables clickjacking, referrer token leaks, MIME sniffing.
- **Fix:** Add `headers()` function to next.config.js (see snippet below).

```javascript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }];
}
```

### 5. Admin Token Stored in localStorage
- [ ] **File:** `src/app/admin/bookings/BookingsDashboard.tsx:1190-1199`
- **Why:** localStorage readable by any JS on the origin. Undermines httpOnly cookie. Any XSS = full admin token exfiltration.
- **Fix:** Remove all localStorage get/set for `_admin_token`. Rely on httpOnly cookie only.

---

## MEDIUM

### 6. Timing-Unsafe Token Comparison (6 locations)
- [ ] **Files:** `middleware.ts:60`, `src/lib/admin-auth.ts:22`, + 4 inline `verifyAdmin()` functions
- **Fix:** Use `crypto.timingSafeEqual` everywhere via shared `safeCompare()`.

### 7. Rate Limiter Non-Functional on Serverless
- [ ] **File:** `middleware.ts:14-33`
- **Why:** In-memory Map resets on cold start. Keys on spoofable `x-forwarded-for`.
- **Fix:** Use Upstash Redis (already provisioned) or Vercel `request.ip`.

### 8. Booking Logs Full PII + Bearer Token
- [ ] **File:** `src/app/api/grad-booking-request/route.ts:90`
- **Why:** Logs fullName, email, phone, managementToken to Vercel logs.
- **Fix:** Log only `{ requestId, packageName }`.

### 9. Admin Token in URL Query Parameters
- [ ] **Files:** `middleware.ts:40`, `src/app/admin/AdminPageClient.tsx:154`
- **Fix:** Add `window.history.replaceState({}, "", window.location.pathname)` after reading token.

### 10. No CSRF on Admin API Routes
- [ ] **Files:** All admin POST/PATCH/DELETE routes
- **Why:** Booking endpoint has Origin check, admin routes don't. Mitigated by SameSite:strict + JSON content-type.
- **Fix:** Add Origin check to shared `requireAdmin()`.

### 11. Stripe Error Details Leaked to Client
- [ ] **File:** `src/app/api/admin/bookings/[id]/charge-remainder/route.ts:88-96`
- **Fix:** Only return message for `StripeCardError`. Generic message for all others.

---

## LOW

### 12. Duplicated Auth Logic
- [ ] Consolidate 4 inline `verifyAdmin()` functions → shared `requireAdmin()` from `src/lib/admin-auth.ts`.

### 13. Middleware Doesn't Cover `/api/admin/*`
- [ ] Extend matcher to include `/api/admin/:path*`.

### 14. Unauthenticated Directory Scan Endpoints
- [ ] `src/app/api/contact-ascii/route.ts`, `src/app/api/grad-book-preview/route.ts` — restrict to specific subdirs or require auth.

### 15. `.gitignore` Gaps
- [ ] Add patterns for `.env.staging`, `.env.preview`, `*.ndjson`, `test-*.png`.

### 16. `globe-test.html` in Production
- [ ] Remove from `public/` or move to non-served directory.

---

## Priority Order

| Priority | Findings | Effort |
|----------|----------|--------|
| P0 | 1 (rotate token), 2 (email URL), 3 (log leak) | ~15 min total |
| P1 | 4 (headers), 5 (localStorage), 8 (PII logs) | ~25 min total |
| P2 | 6 (timing-safe), 7 (rate limiter), 12 (consolidate auth) | ~1 hr total |
| P3 | 9-11, 13-16 | Various |
