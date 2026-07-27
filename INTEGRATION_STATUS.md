# Integration status

| Service | Application integration | Notes |
|---|---|---|
| eGov SSO | Removed | The exchange-code authentication path has been removed. Only the venue-test session path is used. |
| National ID e-Verify | Server routes connected | QR check, QR + liveness verification, and personal-information verification are implemented. |
| eVerify Face Liveness SDK | Browser flow connected | Loads the official SDK URL and passes the supplied public key. |
| Face Liveness REST | Server routes connected | Session creation and result retrieval are available as a secondary integration path. |
| eGov AI | Server integration connected | Generates short-lived tokens, retrieves credits, and provides recycling guidance. |
| Recyclable image recognition | Browser integration connected | MobileNet supplies an initial category suggestion; final material and weight remain physically validated. |
| eMessage | Server route connected | Sends the completed transaction confirmation to an E.164 mobile number. |
| eReport | Server route connected | Submits a citizen complaint with profile and location-code fields. |
| eGovPay | Collection route implemented but disabled | The supplied API charges/collects from a citizen and is not a payout API. It is intentionally not used for rewards. |
| Compass | Excluded | Removed from the agreed Trash2Cash scope. |

## Presentation continuity

External hackathon services can be unavailable, rate-limited, or inaccessible outside the venue network. Identity verification includes clearly labelled event-test paths so judges can still complete the entire product flow while the real provider integrations remain in the codebase.
