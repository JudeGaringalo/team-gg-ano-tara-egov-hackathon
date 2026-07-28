# Trash2Cash — App Codebase Context

## Project Overview

Trash2Cash is a Philippine recycling rewards platform that authenticates citizens via National ID e-Verify, captures images of recyclable materials, estimates value using TensorFlow.js MobileNet + eGov AI guidance, and issues cash or Green Points rewards through an accredited collection center flow.

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx               Root HTML shell + metadata
│   ├── page.tsx                 Entry point — renders Trash2CashApp
│   ├── globals.css              2714 lines of plain CSS
│   └── api/                     Server-side route handlers
│       ├── ai-estimate/route.ts         POST — Mock material estimate
│       ├── validate/route.ts            POST — Mock weight validation + reward calc
│       ├── payment/route.ts             POST — Mock payment claim reference
│       ├── report/route.ts              POST — Mock issue report
│       ├── egov-ai/assistant/route.ts   POST — eGov AI recycling guidance
│       ├── egov-ai/credits/route.ts     GET  — eGov AI token credits
│       ├── emessage/send/route.ts       POST — Send SMS via eMessage
│       ├── ereport/submit/route.ts      POST — Submit eReport complaint
│       ├── everify/config/route.ts      GET  — eVerify public key + SDK URL
│       ├── everify/qr-check/route.ts    POST — Check National ID QR
│       ├── everify/qr-verify/route.ts   POST — Verify National ID QR + face liveness
│       ├── liveness/session/route.ts    POST — Create Face Liveness session
│       ├── liveness/result/route.ts     POST — Get Face Liveness result
│       └── egovpay/status/route.ts      POST — eGovPay transaction lookup
├── components/
│   └── Trash2CashApp.tsx        Single 1119-line SPA component
└── lib/
    ├── provider-http.ts         Shared HTTP utilities
    ├── everify.ts               National ID e-Verify API wrapper
    ├── liveness.ts              Face Liveness REST API wrapper
    ├── egov-ai.ts               eGov AI API wrapper
    ├── egovpay.ts               eGovPay API wrapper
    ├── emessage.ts              eMessage SMS API wrapper
    └── ereport.ts               eReport API wrapper
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.2.10 (App Router) |
| UI Library | React 19.2.7 |
| Styling | Plain CSS (`globals.css`) — no Tailwind, no CSS-in-JS |
| State | `useState` + `sessionStorage`, no external state lib |
| Image Recognition | TensorFlow.js 4.22.0 + MobileNet 2.1.1 (browser-side) |
| QR Generation | `qrcode.react` 4.2.0 |
| QR Decoding | `jsqr` 1.4.0 (browser-side) |
| Language | TypeScript 5.8.3 (strict mode) |
| Path Alias | `@/*` → `./src/*` |

---

## User Flow (11 Steps)

| Step | Purpose |
|------|---------|
| `login` | Start session with event test identity (hackathon profile) |
| `verify` | National ID QR scan + Face Liveness SDK |
| `capture` | Upload/photo recyclable materials |
| `estimate` | MobileNet classification + eGov AI guidance |
| `center` | Select accredited collection center (3 mock options) |
| `validation` | Enter actual accepted weight |
| `reward` | Choose Cash or Green Points |
| `wallet` | Payment channel (GCash / Maya / Bank Account) |
| `paymentQr` | QR code display for partner payout claim |
| `points` | Green Points credit confirmation |
| `complete` | Receipt, SMS confirmation, report issue, restart |

---

## Component Architecture

`src/components/Trash2CashApp.tsx` is a single `"use client"` component (~1119 lines) containing all sub-components inline:

| Sub-component | Purpose |
|---|---|
| `Brand` | Logo + app name |
| `ProgressBar` | 8-step visual progress indicator |
| `Screen` | Layout wrapper (eyebrow, title, desc, content, aside) |
| `VerifyScreen` | QR scanning + Face Liveness SDK |
| `VerificationCard` | Status card for QR/liveness steps |
| `QrDetailsCard` | Parsed National ID QR detail display |
| `CaptureScreen` | Photo upload zone |
| `BottleScene` | CSS-animated bottle illustration |
| `EstimateScreen` | Material metrics + AI guidance display |
| `CenterScreen` | Collection center radio selector |
| `ValidationScreen` | Weight input + reward preview |
| `RewardScreen` | Cash vs Points choice cards |
| `WalletScreen` | Payment channel form |
| `PaymentQrScreen` | QR code via `qrcode.react` |
| `PointsScreen` | Green Points confirmation |
| `CompleteScreen` | Receipt + SMS + report + restart |
| `ReportModal` | eReport complaint form with location codes |
| `InfoAside` | Dark info card sidebar |
| `TransactionAside` | Transaction summary sidebar |
| `Metric` | Single metric display |
| `ReceiptLine` | Label + value line |
| `Icon` | 16 named SVG icon renderer |

---

## API Routes

### Mock Routes (inline logic, no external calls)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai-estimate` | POST | Deterministic hash-based material estimate |
| `/api/validate` | POST | Weight validation + reward calculation |
| `/api/payment` | POST | Payment claim reference generation |
| `/api/report` | POST | Issue report ticket generation |

### Provider Routes (call external APIs via `src/lib/`)

| Route | Method | Lib | Purpose |
|-------|--------|-----|---------|
| `/api/everify/config` | GET | (env vars) | Public key + SDK URL for Face Liveness |
| `/api/everify/qr-check` | POST | `everify` | Pre-check National ID QR value |
| `/api/everify/qr-verify` | POST | `everify` | QR + face liveness verification |
| `/api/liveness/session` | POST | `liveness` | Create face liveness session |
| `/api/liveness/result` | POST | `liveness` | Get liveness verification result |
| `/api/egov-ai/assistant` | POST | `egov-ai` | Recycling guidance from eGov AI |
| `/api/egov-ai/credits` | GET | `egov-ai` | Remaining AI credits |
| `/api/emessage/send` | POST | `emessage` | Send SMS confirmation |
| `/api/ereport/submit` | POST | `ereport` | Submit complaint report |
| `/api/egovpay/status` | POST | `egovpay` | Lookup eGovPay transaction |

---

## eGov Integrations

| Service | Context Doc | Status | Env Vars | Notes |
|---------|-------------|--------|----------|-------|
| National ID e-Verify | `NATIONALID_EVERIFY.md` | Connected | `EVERIFY_*` | QR check, QR+liveness flows |
| Face Liveness (REST) | `FACE_LIVENESS.md` | Connected | `FACE_LIVENESS_*` | Session creation + result retrieval |
| Face Liveness (SDK) | `FACE_LIVENESS.md` | Connected | `EVERIFY_PUBLIC_KEY`, `EVERIFY_LIVENESS_SDK_URL` | Browser `window.eKYC().start()` SDK |
| eGov AI | `EGOVAI.md` | Connected | `EGOV_AI_*` | Token, credits, recycling guidance |
| eMessage | `eMessage.md` | Connected | `EMESSAGE_*` | SMS push on transaction complete |
| eReport | `EREPORT.md` | Connected | `EREPORT_*` | Complaint submission with PSA location codes |
| eGovPay | `EGOVPAY.md` | Implemented, disabled | `EGOV_PAY_*` | Collection endpoint disabled — awaiting payout/disbursement API |

---

## Environment Variables

All read from `process.env` (`.env.local` at project root):

| Variable | Used By |
|----------|---------|
| `EVERIFY_BASE_URL` | `everify.ts` |
| `EVERIFY_CLIENT_ID` | `everify.ts` |
| `EVERIFY_CLIENT_SECRET` | `everify.ts` |
| `EVERIFY_PUBLIC_KEY` | `everify/config/route.ts` |
| `EVERIFY_LIVENESS_SDK_URL` | `everify/config/route.ts` |
| `FACE_LIVENESS_BASE_URL` | `liveness.ts` |
| `FACE_LIVENESS_API_KEY` | `liveness.ts` |
| `EGOV_AI_BASE_URL` | `egov-ai.ts` |
| `EGOV_AI_ACCESS_CODE` | `egov-ai.ts` |
| `EMESSAGE_BASE_URL` | `emessage.ts` |
| `EMESSAGE_ACCESS_TOKEN` | `emessage.ts` |
| `EREPORT_BASE_URL` | `ereport.ts` |
| `EREPORT_ACCESS_TOKEN` | `ereport.ts` |
| `EREPORT_ACCESS_CODE` | `ereport.ts` |
| `EGOV_PAY_BASE_URL` | `egovpay.ts` |
| `EGOV_PAY_API_KEY` | `egovpay.ts` |
| `EGOV_PAY_SETTLEMENT_TEMPLATE_UUID` | `egovpay.ts` |

---

## Styling Conventions

- **File**: `src/app/globals.css` (2714 lines, plain CSS)
- **No Tailwind, no CSS-in-JS, no CSS modules**
- Naming: kebab-case BEM-like (`.login-page`, `.login-grid`, `.login-panel`, `.primary-action`, etc.)
- Color scheme defined via `:root` CSS custom properties
- Responsive with `@media` breakpoints for tablet/desktop

---

## Key Conventions

- `"use client"` — the entire app runs client-side (no server components)
- All API calls from the component use `fetch()` to `/api/*` routes
- Provider credentials/secrets stay server-side in `src/lib/*.ts`
- Citizen profile persisted in `sessionStorage` under key `trash2cash-citizen`
- Mock routes provide deterministic fallbacks when real providers are unavailable
- All verification steps have event-test paths for hackathon demo continuity

---

## Open Items / Known Gaps

- **eGovPay**: The supplied API is a collection (citizen→government) endpoint, not a payout (government→citizen) endpoint. The collection route exists but is disabled (`ENABLE_EGOVPAY_COLLECTION_TEST=false`). A proper payout/disbursement API is needed for real reward distribution.
- **eGov SSO**: Removed from scope — authentication uses only the event test identity path.
