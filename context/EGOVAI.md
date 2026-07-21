# EGOV AI API Documentation

Base URL: `{{base}}`

## Integration Flow

1. Generate an access token using your hackathon `access_code` — `POST /api/v1/egov/integration/token`.
2. Use the returned token (stored as `{{hackathon_token}}`) as a Bearer token for the AI Assistant and Credits endpoints.
3. Check remaining credits anytime with `GET /api/v1/egov/integration/credits`.

---

## 1. Generate Access Token

`POST {{base}}/api/v1/egov/integration/token`

Generates a short-lived access token for authenticating with the eGov API. The token is automatically saved to the `access_token` environment variable upon a successful response.

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `access_code` | string | Yes | The unique access code issued to your team for the hackathon. Stored in the `access_code` environment variable. |

```json
{ "access_code": "{{access_code}}" }
```

### Example Request (cURL)

```bash
curl --request POST \
  --url '{{base}}/api/v1/egov/integration/token' \
  --header 'Content-Type: application/json' \
  --data '{
    "access_code": "{{access_code}}"
}'
```

### Responses

| Status | Description |
|---|---|
| 200 OK | Access token successfully generated. |
| 401 Unauthorized | Invalid access code. |

**200 OK**
```json
{
  "access_token": "bebaddec-de7e-4d4e-91b1-ae3a73544b22",
  "expires_in_seconds": 28800,
  "credits_total": 200,
  "credits_remaining": 200
}
```

**401 Unauthorized**
```json
{
  "code": 401,
  "message": "Invalid access code."
}
```

### Notes
- The `base` environment variable must be set to the correct API base URL before sending this request.
- The returned `access_token` is used as `{{hackathon_token}}` in subsequent authenticated requests.
- Token expires after `expires_in_seconds` (28,800s = 8 hours in the example).

---

## 2. AI Assistant

`POST {{base}}/api/v1/egov/integration/ai_assistant/generate`

Generates an AI-powered response to a user's query about eGov services. Accepts a natural language prompt and a category/country code, then returns a contextually relevant answer scoped to the specified eGov service region.

### Authentication

| Type | Token |
|---|---|
| Bearer Token | `{{hackathon_token}}` |

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | string | Yes | The user's natural language question (e.g., "how can i get my digital tin id here in egov"). |
| `category` | string | Yes | Category/country code to scope the response (e.g., `"PH"` for Philippines). |

```json
{
  "prompt": "how can i get my digital tin id here in egov",
  "category": "PH"
}
```

### Example Request (cURL)

```bash
curl --request POST \
  --url '{{base}}/api/v1/egov/integration/ai_assistant/generate' \
  --header 'Authorization: Bearer {{hackathon_token}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "prompt": "how can i get my digital tin id here in egov",
    "category": "PH"
}'
```

### Responses

| Status | Description |
|---|---|
| 200 OK | AI-generated answer returned successfully. |
| 401 Unauthorized | Missing/invalid/expired token. |

**200 OK**
```json
{
  "data": "<AI-generated natural language answer>",
  "session_id": "b67017a4-da57-40ab-96c9-ca0ccb530ec7"
}
```

### Notes
- `category`: use the appropriate country/region code — `"PH"` targets Philippine eGov services.
- More specific, clearly worded prompts yield more accurate responses.
- `{{hackathon_token}}` may expire or have scope restrictions — regenerate via the Generate Access Token endpoint if needed.
- `{{base}}` should point to the correct API environment (Local, Staging, or Production).

---

## 3. Token Credits

`GET {{base}}/api/v1/egov/integration/credits`

Retrieves the current token credit balance associated with the authenticated hackathon participant/team. Useful for monitoring remaining API credits to avoid hitting limits.

### Authentication

| Type | Token |
|---|---|
| Bearer Token | `{{hackathon_token}}` |

### Example Request (cURL)

```bash
curl --request GET \
  --url '{{base}}/api/v1/egov/integration/credits' \
  --header 'Authorization: Bearer {{hackathon_token}}'
```

### Responses

| Status | Description |
|---|---|
| 200 OK | Returns credit balance and usage details. |
| 401 Unauthorized | Missing access token. |

**200 OK**
```json
{
  "credits_total": 200,
  "credits_used": 5,
  "credits_remaining": 195,
  "expires_at": "2026-07-10T23:33:34.000+08:00"
}
```

**401 Unauthorized**
```json
{
  "code": 401,
  "message": "Missing access token."
}
```

### Notes
- Token credits may be consumed by other endpoints in the hackathon API — check balance before resource-intensive calls.
- Ensure `base` is configured to the correct API environment.

---

## Endpoint Summary

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/egov/integration/token` | POST | Generate hackathon access token from access code |
| `/api/v1/egov/integration/ai_assistant/generate` | POST | Get AI-generated answer to an eGov services query |
| `/api/v1/egov/integration/credits` | GET | Check remaining API credit balance |
