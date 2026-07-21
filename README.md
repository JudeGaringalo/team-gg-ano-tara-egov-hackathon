# Trash2Cash — Hackathon API Integration Build

Standalone, responsive Next.js application for the complete citizen journey:

1. eGovPH citizen sign-in through eGov SSO
2. National ID QR or citizen-profile verification
3. Face Liveness camera session
4. Recyclable image capture and local image classification
5. eGov AI recycling guidance
6. Accredited MRF / partner junkshop selection
7. Physical inspection and final weight validation
8. Cash or Green Points selection
9. Wallet claim reference and receipt
10. eMessage confirmation and eReport issue submission

## Start locally

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`.

Camera features require browser permission. Use `localhost` locally or HTTPS when deployed.

## Real eGovPH sign-in

The partner website expects eGovPH to open its registered callback URL with:

```text
?exchange_code=...
```

Trash2Cash detects that value automatically, exchanges it server-side, and retrieves the citizen profile. During venue testing, the code may also be pasted on the login screen. An event test identity remains available so the complete pitch flow is not blocked by provider availability.

## National ID verification

The verification screen supports:

- Rear-camera National ID QR scanning through the browser Barcode Detector when available
- Manual QR-value paste as a browser fallback
- National ID QR pre-check
- Official eVerify Face Liveness browser SDK
- Final QR + liveness verification
- Personal-information verification using the eGovPH citizen profile
- Event test verification for presentation continuity
s
## Connected provider routes

- `POST /api/sso/callback`
- `GET /api/everify/config`
- `POST /api/everify/qr-check`
- `POST /api/everify/qr-verify`
- `POST /api/everify/personal`
- `POST /api/liveness/session`
- `POST /api/liveness/result`
- `POST /api/egov-ai/assistant`
- `GET /api/egov-ai/credits`
- `POST /api/emessage/send`
- `POST /api/ereport/submit`

All private credentials remain in `.env.local` and are read only by server routes, except the eVerify public key intentionally returned to the official browser SDK.

## eGovPay limitation

The supplied eGovPay documentation describes a **payment collection** transaction where money is collected from a citizen. Trash2Cash needs a **government-to-citizen reward payout**. The documented collection route is implemented at `/api/egovpay/collection`, but it is disabled by default with:

```env
ENABLE_EGOVPAY_COLLECTION_TEST=false
```

The reward screen therefore produces the payment-partner claim reference locally and does not charge the citizen. Connect a documented payout/disbursement endpoint when the organizers provide one.

## Provider base URLs

The provider URLs are environment variables in `.env.local`. If the hackathon portal's Variables panel shows a different eVerify or eReport host, update only:

```env
EVERIFY_BASE_URL=...
EREPORT_BASE_URL=...
```

No application code changes are required.

## Checks completed

```powershell
npm run typecheck
npm run build
```

Both complete successfully. The local build environment used to create this ZIP could not resolve the external hackathon hostnames, so live provider responses must be tested on the event network or deployed Vercel environment.
