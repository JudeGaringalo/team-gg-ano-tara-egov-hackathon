# Face Liveness API Documentation

Base URL: `{{baseUrl}}`

Contains the Create Session and Get Verification Result endpoints with automatic session token propagation.

## Integration Flow

1. Create a session — `POST /v1/liveness/session` — configuring the desired completion action (`redirect`, `post`, or `close`). Get back a `token` and a verification `url`.
2. Direct the user to the returned `url` to perform the liveness check.
3. Once complete, retrieve the result backend-to-backend — `GET /v1/liveness/result/{{sessionToken}}` — and check `status` + `confidence_score` against the recommended security threshold before trusting the result.

---

## 1. Create Session

`POST {{baseUrl}}/v1/liveness/session`

Initializes a liveness session. Send a payload configuring the completion action to receive a dynamic verification URL and session token.

### Headers

| Key | Value |
|---|---|
| `x-api-key` | `{{apiKey}}` |
| `Content-Type` | `application/json` |

### Request Body

| Parameter | Type | Required | Description |
|---|---|---|---|
| `action` | string | Yes | The user flow action to execute upon verification completion. Supported values: `redirect`, `post`, `close`. |
| `callback_url` | string | Yes (for `redirect` flow) | The destination URL where the user is redirected. Only applicable when `action` is `redirect`. |
| `delay` | integer | No | Delay in milliseconds to show the completion check screen before redirecting/closing. Defaults to `3000`. |

```json
{
  "action": "redirect",
  "callback_url": "https://your-app.com/callback",
  "delay": 3000
}
```

### Example Request (cURL)

```bash
curl --request POST \
  --url '{{baseUrl}}/v1/liveness/session' \
  --header 'x-api-key: {{apiKey}}' \
  --header 'Content-Type: application/json' \
  --data '{
  "action": "redirect",
  "callback_url": "https://your-app.com/callback",
  "delay": 3000
}'
```

### Responses

| Status | Description |
|---|---|
| 201 Created | Session created; returns session `token` and verification `url`. |

**201 Created — Post Message Flow (`action: "post"`)**
```json
{
  "token": "00000000-0000-0000-0000-000000000000",
  "url": "https://hackathon-face-liveness.e.gov.ph/liveness?token=00000000-0000-0000-0000-000000000000&action=post"
}
```

**201 Created — Close Flow (`action: "close"`)**
```json
{
  "token": "00000000-0000-0000-0000-000000000000",
  "url": "https://hackathon-face-liveness.e.gov.ph/liveness?token=00000000-0000-0000-0000-000000000000&action=close&delay=3000"
}
```

**201 Created — Redirect Flow (`action: "redirect"`)**
```json
{
  "token": "00000000-0000-0000-0000-000000000000",
  "url": "https://hackathon-face-liveness.e.gov.ph/liveness?token=00000000-0000-0000-0000-000000000000&action=redirect&callbackUrl=https%3A%2F%2Fyour-app.com%2Fcallback&delay=3000"
}
```

---

## 2. Get Verification Result

`GET {{baseUrl}}/v1/liveness/result/{{sessionToken}}`

Protected backend-to-backend endpoint to retrieve the final verification result (status, confidence score, and pre-signed selfie URL) for a session using the verification token.

### Headers

| Key | Value |
|---|---|
| `x-api-key` | `{{apiKey}}` |

### Example Request (cURL)

```bash
curl --request GET \
  --url '{{baseUrl}}/v1/liveness/result/{{sessionToken}}' \
  --header 'x-api-key: {{apiKey}}'
```

### Responses

| Status | Description |
|---|---|
| 200 OK | Returns verification status, confidence score, and reference image URL. |

**200 OK**
```json
{
  "status": "SUCCEEDED",
  "confidence_score": 98.71,
  "reference_image_url": "https://face-liveness-audit-staging-tokyo.s3.ap-northeast-1.amazonaws.com/liveness-audits/00000000-0000-0000-0000-000000000000/reference.jpg?AWSAccessKeyId=..."
}
```

### ⚠️ Recommended Security Threshold
- **Verification Status**: must be exactly `"SUCCEEDED"`.
- **Confidence Score Threshold**: must be `95.0` or higher (out of `100.0`).
- **Spoof Handling**: if the score is below `95.0`, reject the session as high-risk and request a retry.

Do not treat a 200 response alone as success — always check both `status` and `confidence_score` against these thresholds before trusting the result.

---

## Endpoint Summary

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/liveness/session` | POST | Create a liveness session, get session token + verification URL |
| `/v1/liveness/result/{sessionToken}` | GET | Retrieve final liveness verification result |
