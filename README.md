
The original README line appears here.

**A recycling-rewards prototype by Team GG for the eGov Hackathon.**

eKalakal (Trash2Cash) explores a simpler way for citizens to turn recyclable materials into value. It brings material identification, drop-off guidance, weight validation, and reward selection into one mobile-friendly experience—with optional connections to participating e-government services.

> [!IMPORTANT]
> **Hackathon prototype, not a live government or payment service.** The app uses a venue-test citizen session, illustrative collection-center data, and simulated rewards. Identity verification and other external integrations require authorized provider access. **Real cash payouts and persistent Green Points balances are not implemented.**

## The Citizen Experience

1. **Start a session** — Enter through the hackathon's venue-test citizen flow.
2. **Verify identity** — Try event-test verification, or use National ID QR and Face Liveness with configured eVerify services.
3. **Identify recyclables** — Upload a photo or use prepared sample materials. MobileNet suggests a category, while eGov AI can provide preparation guidance.
4. **Choose a drop-off location** — Browse sample materials recovery facilities and partner junkshops on an interactive map.
5. **Validate the weight** — Enter the accepted weight to recalculate the estimated reward.
6. **Choose a reward** — Explore the simulated Green Points experience or the cash-payment interface, noting the payment limitations below.
7. **Review the outcome** — View a demo receipt, citizen dashboard, community waste heatmap, and issue-reporting interface.

## Features and Integration Status

| Capability | What the current build supports |
| --- | --- |
| Citizen access | Venue-test session; eGovPH exchange-code SSO has been removed. |
| National ID and liveness | Event-test bypass or provider-backed QR and Face Liveness verification when configured. |
| Image recognition | Browser-based TensorFlow.js / MobileNet classification with a prepared-sample fallback. |
| Recycling guidance | eGov AI request through a server route; general guidance appears if the service is unavailable. |
| Drop-off map | Leaflet map with illustrative locations, schedules, and distances—not live facility data. |
| Rewards | Estimated cash values and a simulated Green Points flow; no actual payouts or wallet ledger. |
| Community reporting | eReport submission route plus a heatmap containing sample and browser-local markers. |
| Notifications | eMessage route for configured provider access. |

For provider-by-provider details, see [Integration Status](INTEGRATION_STATUS.md) and the [integration notes](context/).

## Getting Started

### Prerequisites

Before running the project, make sure you have:

- **Node.js 20 or later**
- **npm** (the project declares `npm@11.13.0`)
- An internet connection for installing dependencies
- A modern browser that supports camera access

Camera-based features require browser permission and a secure context, such as `localhost` or HTTPS.

### Installation

Clone the repository:

```bash
git clone https://github.com/JudeGaringalo/team-gg-ano-tara-egov-hackathon.git
```

Navigate to the project directory:

```bash
cd team-gg-ano-tara-egov-hackathon
```

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to:

**http://localhost:3000**

> **No provider credentials?** You can still explore the event-test identity flow, prepared recyclable materials, and simulated Green Points rewards.

## Demo Walkthrough

Follow these steps to explore eKalakal's main features.

### 1. Start and verify

- Click **Start session**.
- Select **Use event test verification**.
- Continue to the recycling process.

### 2. Identify recyclable materials

- Upload an image of recyclable materials or select **Use prepared recyclable materials**.
- Click **Analyze recyclable image**.
- Review the suggested material category, estimated weight, and preparation guidance.

Image recognition provides an initial suggestion. Actual material type and weight must be validated during physical collection.

### 3. Choose a collection center

- Browse the available sample facilities.
- View their locations on the interactive map.
- Select your preferred drop-off location.

Collection centers, operating hours, and availability are demonstration data.

### 4. Validate and calculate rewards

- Enter the accepted weight of the recyclable materials.
- Review the estimated monetary equivalent.
- Compare the cash reward and Green Points options.

### 5. Complete the transaction

- Select **Green Points** to explore the simulated rewards flow.
- Review the transaction receipt.
- Access the citizen dashboard and community waste heatmap.

Live eReport and eMessage requests require their respective provider credentials.

## Government Service Integrations

eKalakal includes server-side integration routes for several government services used in the hackathon.

### Environment Configuration

Create a `.env.local` file in the root directory for integrations you are authorized to test.

| Service | Environment Variables |
| --- | --- |
| National ID eVerify | `EVERIFY_BASE_URL`, `EVERIFY_CLIENT_ID`, `EVERIFY_CLIENT_SECRET`, `EVERIFY_PUBLIC_KEY`, `EVERIFY_LIVENESS_SDK_URL` |
| Face Liveness REST | `FACE_LIVENESS_BASE_URL`, `FACE_LIVENESS_API_KEY` |
| eGov AI | `EGOV_AI_BASE_URL`, `EGOV_AI_ACCESS_CODE` |
| eMessage | `EMESSAGE_BASE_URL`, `EMESSAGE_ACCESS_TOKEN` |
| eReport | `EREPORT_BASE_URL`, `EREPORT_ACCESS_CODE`, `EREPORT_ACCESS_TOKEN` |
| eGovPay Collection | `EGOV_PAY_BASE_URL`, `EGOV_PAY_API_KEY`, `EGOV_PAY_SETTLEMENT_TEMPLATE_UUID` |

Some provider URLs have defaults in the code. Valid credentials and provider connectivity are still required for live requests.

> [!CAUTION]
> Never commit API credentials, access codes, private keys, or real citizen information to the repository. The `.env.local` file is excluded from version control.

### Important: Payment Integration Limitations

The current `/api/egovpay/collection` endpoint creates a **payment collection request**, which collects money from a citizen.

It is **not a government-to-citizen payout service**.

The application's cash-reward interface calls this collection route. Therefore:

- Do not use live collection credentials to issue citizen rewards.
- Do not treat generated payment requests as completed cash payouts.
- Do not use the prototype for real financial transactions.

The separate `/api/payment` endpoint can generate a demonstration claim reference, but it is not connected to the main cash-reward checkout.

Actual cash disbursement, wallet transfers, and production reward accounting are not implemented.

## Technology Stack

eKalakal is built with modern web technologies to support responsive interfaces and third-party service integrations.

| Category | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | CSS |
| Mapping | Leaflet |
| Image Recognition | TensorFlow.js, MobileNet |
| QR Processing | jsQR, qrcode.react |
| Backend | Next.js API Routes |
| Integrations | Server-side government service clients |

## Project Structure

```text
team-gg-ano-tara-egov-hackathon/
├── public/
│   └── Static assets and images
├── src/
│   ├── app/
│   │   ├── api/
│   │   └── Global styles and pages
│   ├── components/
│   │   └── Citizen journey and maps
│   └── lib/
│       └── Provider integration clients
├── context/
│   └── Government integration documentation
├── scripts/
│   └── Integration test scripts
├── INTEGRATION_STATUS.md
├── package.json
└── README.md
```

## Development and Testing

### Type Checking

Validate the TypeScript implementation:

```bash
npm run typecheck
```

### Production Build

Generate the production build:

```bash
npm run build
```

### eGov AI Connectivity

To test eGov AI authentication and credits retrieval, configure `EGOV_AI_ACCESS_CODE` inside `.env.local`.

Then execute:

```bash
npm run test:egov-ai
```

This command makes requests to the external provider and requires valid access credentials.

A successful local build does not guarantee external government services are accessible.

## Known Limitations

As a hackathon prototype, several features use demonstration data or require additional production infrastructure.

- **Citizen authentication:** eGovPH exchange-code SSO has been removed. The app currently uses a venue-test session.
- **Identity verification:** Event-test verification bypasses real identity checks. Live QR and Face Liveness verification require configured services.
- **Collection centers:** Locations, schedules, distances, and availability are illustrative.
- **Material analysis:** Image classification provides suggestions rather than certified material identification.
- **Recycling rewards:** Cash estimates, dashboard values, and Green Points are not connected to a production rewards ledger.
- **Community heatmap:** Displays sample information and browser-local markers rather than a live nationwide dataset.
- **Payments:** Real cash disbursement is not implemented.
- **Provider availability:** External integrations may be inaccessible outside authorized environments or the hackathon network.

Refer to [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md) for the latest implementation details.

## Contributing

Contributions from Team GG members are welcome.

To contribute:

1. Create a new feature or documentation branch.
2. Make your proposed changes.
3. Run the relevant development checks.
4. Open a pull request targeting `main`.
5. Review the changes with other team members.
6. Merge the pull request after approval.

GitHub supports co-authored commits and suggested changes that credit contributors who collaborate on the same work.

Keep documentation consistent with the current implementation, especially when updating integrations, environment variables, and prototype limitations.

---

## About Team GG

**eKalakal was developed by Team GG for the eGov Hackathon.**

Our vision is to explore how digital government services and accessible technology could encourage responsible recycling, support community participation, and make recyclable materials more valuable to citizens.

**Turn waste into value. Recycle smarter. Build a greener future.**

*This repository is a hackathon prototype and does not represent an operational government rewards or payment service.*
