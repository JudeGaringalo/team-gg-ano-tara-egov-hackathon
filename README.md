# eKalakal (Trash2Cash)

**Team GG's eGov Hackathon prototype** for turning recyclable waste into a simulated cash reward or Green Points. The responsive Next.js app walks a citizen through identity verification, material identification, drop-off selection, weight validation, and a transaction receipt.

> **Prototype, not a production government service.** The app includes venue-test identity verification, sample collection centers, estimated recycling values, and demonstration reward data. External eGovPH integrations need organizer-provided credentials and network access. No real government-to-citizen payout is implemented.

## What you can try

- **Citizen verification:** Start a venue-test session; use event-test verification or connect National ID QR and Face Liveness services.
- **Recyclable image analysis:** Upload an image for in-browser MobileNet classification, or use the sample image. eGov AI guidance falls back to general preparation advice if the provider is unavailable.
- **Drop-off selection:** Explore sample materials recovery facilities and junkshops using the Leaflet map.
- **Weight and reward estimation:** Enter the accepted weight and compare the prototype cash value with Green Points.
- **Transaction walkthrough:** Complete the Green Points demo, view a receipt and citizen dashboard, and explore the waste heatmap.
- **Reporting and notifications:** The app has eReport and eMessage API routes for configured provider integrations. The heatmap combines sample data with markers saved in the browser.

## Run locally

### Prerequisites

- Node.js **20 or later** (as declared in `package.json`)
- npm and an internet connection for the initial dependency install
- A modern browser; camera access requires permission and a secure context (`localhost` or HTTPS)

```bash
git clone https://github.com/JudeGaringalo/team-gg-ano-tara-egov-hackathon.git
cd team-gg-ano-tara-egov-hackathon
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You can explore the **event-test + sample-image + Green Points** path without connecting the external providers. Live verification, AI guidance, messaging, reporting, and payment-collection calls require the relevant service configuration.

### Suggested demo walkthrough

1. Click **Start session**, then **Use event test verification** on the National ID screen.
2. Add a recyclable-material photo or choose the sample image. Review the material suggestion and preparation guidance.
3. Choose a sample drop-off center and enter the accepted weight. These locations and values are demonstration data, not live facility availability or pricing.
4. Select **Green Points** to finish the locally simulated reward flow and view the receipt. The cash path depends on an eGovPay *collection* integration and is **not** a working cash-disbursement flow.
5. Explore the citizen dashboard, waste heatmap, and issue-reporting interface. Provider-backed submissions require credentials; locally added heatmap markers are stored in the browser.

## Optional government-service configuration

Create a `.env.local` file in the project root **only for integrations you are authorized to test**. It is ignored by Git. Do not commit API keys, access codes, personal IDs, or real citizen data.

| Integration | Environment variables used by the code |
| --- | --- |
| National ID eVerify | `EVERIFY_BASE_URL`, `EVERIFY_CLIENT_ID`, `EVERIFY_CLIENT_SECRET`, `EVERIFY_PUBLIC_KEY`, `EVERIFY_LIVENESS_SDK_URL` |
| Face Liveness REST (secondary path) | `FACE_LIVENESS_BASE_URL`, `FACE_LIVENESS_API_KEY` |
| eGov AI | `EGOV_AI_BASE_URL`, `EGOV_AI_ACCESS_CODE` |
| eMessage | `EMESSAGE_BASE_URL`, `EMESSAGE_ACCESS_TOKEN` |
| eReport | `EREPORT_BASE_URL`, `EREPORT_ACCESS_CODE`, `EREPORT_ACCESS_TOKEN` |
| eGovPay collection | `EGOV_PAY_BASE_URL`, `EGOV_PAY_API_KEY`, `EGOV_PAY_SETTLEMENT_TEMPLATE_UUID` |

Provider base URLs and SDK settings have code defaults where supported, but the corresponding credentials still need to be supplied for live requests. See [`INTEGRATION_STATUS.md`](INTEGRATION_STATUS.md) and [`context/`](context/) for implementation status and integration notes.

**Payment warning:** `/api/egovpay/collection` creates a *payment collection request* (money paid by a citizen), not a reward payout. The app's cash path calls that route, so **do not enable or use it with live payment credentials as a citizen-reward flow**. The separate `/api/payment` route returns a demonstration claim reference, but it is not the main reward checkout. There is no implemented disbursement API or production wallet crediting.

## Tech stack and project layout

| Layer | Implementation |
| --- | --- |
| Web app | Next.js 16 App Router, React 19, TypeScript |
| UI and mapping | CSS, Leaflet |
| Image and QR handling | TensorFlow.js / MobileNet, `jsqr`, `qrcode.react` |
| External services | Next.js API routes and server-side provider clients |

```text
src/app/                    Pages, styles, and API route handlers
src/components/             Citizen journey and interactive maps
src/lib/                    Provider-specific server clients
context/                    Hackathon service integration notes
scripts/test-egov-ai.mjs    Optional eGov AI connectivity check
INTEGRATION_STATUS.md       Current provider status and limitations
```

## Development checks

```bash
npm run typecheck
npm run build
```

To test **only** the eGov AI token and credits endpoints against a configured provider, add `EGOV_AI_ACCESS_CODE` to `.env.local` and run:

```bash
npm run test:egov-ai
```

That command makes real external requests and will fail without working provider access. Build/type-check results do not establish that external government services are reachable.

## Prototype limitations

- eGovPH exchange-code SSO sign-in has been **removed**; the login screen currently starts a venue-test citizen session.
- Event-test verification bypasses live identity checks. Real National ID QR / Face Liveness verification requires configured eVerify services.
- Sample centers, estimated material quantities, rates, dashboard figures, and Green Points are not sourced from a live LGU or rewards ledger.
- The community heatmap includes sample markers and browser-local reports; it is not a live nationwide waste dataset.
- Cash payout/disbursement is not implemented, and provider integrations may be unavailable outside the hackathon network.

For the detailed integration state, consult [`INTEGRATION_STATUS.md`](INTEGRATION_STATUS.md) before a demo or deployment.
