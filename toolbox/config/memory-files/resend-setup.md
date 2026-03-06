# Resend + Email Setup — COMPLETE

## Status: All set up. Needs redeploy + end-to-end test.

## What's Done
- Resend account created (username: ephratah17)
- Domain `phredomade.com` verified in Resend (Squarespace DNS, all 4 records green)
- API key created: `phredomade-booking` (Sending access, All Domains)
- Vercel env vars set: `RESEND_API_KEY`, `BOOKING_REQUEST_EMAIL_TO` (phredomade@gmail.com), `BOOKING_REQUEST_EMAIL_FROM` (bookings@phredomade.com)
- API route (`src/app/api/grad-booking-request/route.ts`) has full Resend integration
- Package validation: "Bronze Grad", "Silver Grad", "Gold Grad", "Diamond Grad"

## Email Strategy
- Resend for outbound (branded `bookings@phredomade.com`) + free Gmail for inbox
- reply_to set to client's email address in booking emails

## Remaining
- Redeploy on Vercel (so env vars take effect)
- End-to-end test: submit booking form → confirm email arrives at Gmail
