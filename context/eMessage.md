# eMessage API Documentation

Base URL: `{{base_url}}`

## Authentication
All requests require the `X-EMESSAGE-Auth` header set to your API token.

---

## 1. Push SMS

`POST {{base_url}}/messaging/v1/sms/push`

Sends an SMS message to a recipient number.

### Headers

| Header | Value | Required | Description |
|---|---|---|---|
| `X-EMESSAGE-Auth` | `<API-TOKEN>` | Yes | eMessage API auth token. |
| `Content-Type` | `application/json` | Yes | Request body is JSON. |

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `number` | string | Yes | Recipient mobile number in E.164 format, e.g. `+639090000000`. |
| `message` | string | Yes | The SMS message body. |

```json
{
  "number": "+639090000000",
  "message": "Test message"
}
```

### Example Request (cURL)

```bash
curl --request POST \
  --url '{{base_url}}/messaging/v1/sms/push' \
  --header 'X-EMESSAGE-Auth: {{api_token}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "number": "+639090000000",
    "message": "Test message"
}'
```

### Responses

| Status | Description |
|---|---|
| 201 Created | SMS successfully queued/sent. |
| 400 Bad Request | Auth token missing or invalid. |
| 422 Unprocessable Entity | Validation failure — required field(s) missing. |

**201 Created**
```json
{
  "data": {
    "message": "SMS was successfully created."
  }
}
```

**400 Bad Request**
```json
{
  "error": "token_was_invalid",
  "message": "token was not define in your request.",
  "error_description": "token was not define in your request."
}
```

**422 Unprocessable Entity**
```json
{
  "error": "unprocessable_entity",
  "message": "The given data was invalid.",
  "error_description": "The given data was invalid.",
  "errors": {
    "message": ["validation.required"],
    "number": ["validation.required"]
  }
}
```

---

## Endpoint Summary

| Endpoint | Method | Purpose |
|---|---|---|
| `/messaging/v1/sms/push` | POST | Send an SMS to a recipient number |

## Notes
- Rate limit observed: 10,000 requests/window (`x-ratelimit-limit`).
- Never expose `api_token` client-side — send SMS requests from your backend only.
