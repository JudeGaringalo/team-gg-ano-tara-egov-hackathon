# NIDAS eVerify API Documentation (National ID)

REST API for Relying Parties — Tier 1 and Tier 2 identity authentication.

Base URL: `{{base_url}}`

## Integration Flow

1. Obtain an `access_token` from the **Authenticate** endpoint (server-to-server, client credentials).
2. Secure a `face_liveness_session_id` via the **Face Liveness Web SDK**: call `window.eKYC().start({ pubKey })` and use `result.session_id`.
3. Submit demographics + `face_liveness_session_id` to the **Verify Personal Information** endpoint, or scan a QR code and use **QR Check** / **QR Verify**.

---

## 1. Authenticate (Generate Access Token)

`POST {{base_url}}/api/auth`

Generates a server-to-server `access_token`. Every call to the verification endpoints requires this token.

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `client_id` | string | Yes | Your assigned API Client ID. |
| `client_secret` | string | Yes | Your assigned API Client Secret. |

```json
{
  "client_id": "{{client_id}}",
  "client_secret": "{{client_secret}}"
}
```

### Example Request (cURL)

```bash
curl --request POST \
  --url '{{base_url}}/api/auth' \
  --header 'Content-Type: application/json' \
  --data '{
    "client_id": "{{client_id}}",
    "client_secret": "{{client_secret}}"
}'
```

### Responses

| Status | Description |
|---|---|
| 200 OK | Access token successfully generated. |
| 403 Forbidden | Invalid client credentials. |

**200 OK**
```json
{
  "data": {
    "access_token": "eyJ0eXAiOiJKV1Qi...",
    "token_type": "Bearer",
    "expires_at": "1724223772"
  }
}
```

**403 Forbidden**
```json
{
  "error": "invalid_credentials",
  "message": "Invalid credentials.",
  "error_description": "Invalid credentials."
}
```

### Notes
- Use the returned `access_token` as a Bearer token in the `Authorization` header of the verify endpoints.
- Store `client_secret` securely — never expose it client-side.

---

## 2. Verify Personal Information

`POST {{base_url}}/api/query`

Compares the user's demographic input and biometrics (Face Liveness) against the NIDAS database.

### Headers

| Header | Value |
|---|---|
| `Authorization` | `Bearer <access_token>` |

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `first_name` | string | Yes | |
| `middle_name` | string | No | |
| `last_name` | string | Yes | |
| `suffix` | string | No | |
| `birth_date` | string (YYYY-MM-DD) | Yes | |
| `face_liveness_session_id` | string (UUID) | Yes | The `session_id` from the Liveness Web SDK. |

```json
{
  "first_name": "Juan",
  "middle_name": "Santos",
  "last_name": "Dela Cruz",
  "suffix": "JR",
  "birth_date": "1989-09-12",
  "face_liveness_session_id": "a1b3fae6-af74-4896-bd58-32a81604de01"
}
```

### Example Request (cURL)

```bash
curl --request POST \
  --url '{{base_url}}/api/query' \
  --header 'Authorization: Bearer {{access_token}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "first_name": "Juan",
    "middle_name": "Santos",
    "last_name": "Dela Cruz",
    "suffix": "JR",
    "birth_date": "1989-09-12",
    "face_liveness_session_id": "a1b3fae6-af74-4896-bd58-32a81604de01"
}'
```

### Responses

| Status | Description |
|---|---|
| 200 OK | Match processed. Returns full demographic/biometric profile. |
| 401 Unauthorized | Missing/invalid/expired access token. |

**200 OK — key response fields**
- Identity: `code`, `token`, `reference`, `face_url`, `full_name`, `first_name`, `middle_name`, `last_name`, `suffix`, `gender`, `marital_status`, `blood_type`, `email`, `mobile_number`, `birth_date`
- Registered address: `full_address`, `address_line_1/2`, `barangay`, `municipality`, `province`, `country`, `postal_code`
- Present address: `present_full_address`, `present_address_line_1/2`, `present_barangay`, `present_municipality`, `present_province`, `present_country`, `present_postal_code`
- Other: `residency_status`, `place_of_birth`, `pob_municipality`, `pob_province`, `pob_country`
- `meta`: `tier_level` (e.g. "Tier II"), `result_grade`

### Notes
- `face_liveness_session_id` is secured via the eVerify Face Liveness Web SDK: call `window.eKYC().start({ pubKey })` and pass `result.session_id`.

---

## 3. QR Check

`POST {{base_url}}/api/query/qr/check`

Checks and decodes a scanned National ID QR code value. Decrypts and returns the verified demographics stored inside the QR code. No biometric match required.

### Headers

| Header | Value |
|---|---|
| `Authorization` | `Bearer <access_token>` |

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `value` | string | Yes | Raw string value scanned from the National ID QR code. |

```json
{ "value": "RAW_QR_CODE_VALUE" }
```

### Example Request (cURL)

```bash
curl --request POST \
  --url '{{base_url}}/api/query/qr/check' \
  --header 'Authorization: Bearer {{access_token}}' \
  --header 'Content-Type: application/json' \
  --data '{ "value": "RAW_QR_CODE_VALUE" }'
```

### Responses

| Status | Description |
|---|---|
| 200 OK | Valid QR code. Returns decrypted profile data (shape varies by `qr_type`). |
| 422 Unprocessable Content | Invalid QR code format. |

The response shape depends on `meta.qr_type`:

- **Philsys Card** — `pcn`, `first_name`, `middle_name`, `last_name`, `birth_date`, `suffix`, `sex`, `place_of_birth`, `best_finger_captured` (array), `date_issued`
- **Digital ID** — just `digital_id`
- **National ID Signed** — `issuer`, `version`, `digital_id`, `pcn`, name fields, `issued_at`, `sex`, `blood_type`, `marital_status`, `place_of_birth`, `best_finger_captured`, `photo` (base64)
- **ePhilId** — same as Philsys Card plus `image` (base64)

**422 Unprocessable Content**
```json
{
  "message": "Invalid QR code format.",
  "errors": {
    "value": ["Invalid QR code format."]
  }
}
```

---

## 4. QR Verify

`POST {{base_url}}/api/query/qr`

Performs full identity verification using the scanned National ID QR code value **and** matching biometrics (Face Liveness).

### Headers

| Header | Value |
|---|---|
| `Authorization` | `Bearer <access_token>` |

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `value` | string | Yes | Raw string value scanned from the National ID QR code. |
| `face_liveness_session_id` | string (UUID) | Yes | The `session_id` from the Liveness Web SDK. |

```json
{
  "value": "RAW_QR_CODE_VALUE",
  "face_liveness_session_id": "a1b3fae6-af74-4896-bd58-32a81604de01"
}
```

### Example Request (cURL)

```bash
curl --request POST \
  --url '{{base_url}}/api/query/qr' \
  --header 'Authorization: Bearer {{access_token}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "value": "RAW_QR_CODE_VALUE",
    "face_liveness_session_id": "a1b3fae6-af74-4896-bd58-32a81604de01"
}'
```

### Responses

| Status | Description |
|---|---|
| 200 OK | Verification processed. Returns full profile if matched, or `verified: false` if face doesn't match. |

**200 OK — Matched**
Same profile shape as Verify Personal Information (`code`, `token`, `reference`, `face_url`, name/address/birth fields, etc.), plus `meta.tier_level` and `meta.result_grade`.

**200 OK — Unverified (Face Mismatch)**
```json
{
  "data": { "verified": false },
  "meta": {
    "tier_level": "Tier II",
    "result_grade": "FAILED_FACE"
  }
}
```

---

## Endpoint Summary

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth` | POST | Get server-to-server access token |
| `/api/query` | POST | Verify demographics + face liveness |
| `/api/query/qr/check` | POST | Decode QR code (no biometric match) |
| `/api/query/qr` | POST | Full QR + face liveness verification |

## Handling Notes
Responses from this API return extensive PII (full name, address, biometric photo, blood type, marital status). Handle per Data Privacy Act (RA 10173) requirements — minimize what you persist, and never log or expose `client_secret`, `access_token`, or raw face images beyond what your integration strictly needs.
