# EGOV PH API Documentation

Base URL: `{{base_url}}`

## Authentication Flow (OAuth 2.0 Authorization Code)

1. Obtain an **exchange code** for a user via the eGov SSO flow (test account: `josie@yopmail.com`).
2. Exchange that code for an **access token** — `POST /api/token`.
3. Use the access token to resolve the authenticated user's profile — `POST /api/partner/sso_authentication`.

---

## 1. Generate Access Token

`POST {{base_url}}/api/token`

Exchanges an authorization code for an access token using the eGov SSO service. This is part of the OAuth 2.0 authorization code flow — after a user authenticates and an exchange code is issued, the partner system calls this endpoint to obtain an access token for subsequent API requests.

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `exchange_code` | string | Yes | The authorization code received after user authentication. |
| `scope` | string | Yes | The requested scope. Use `SSO_AUTHENTICATION` for standard SSO login. |
| `partner_code` | string | Yes | The unique code identifying the partner/agency system. |
| `partner_secret` | string | Yes | The secret key associated with the partner account. |

```json
{
  "exchange_code": "generated_exchange_code",
  "scope": "SSO_AUTHENTICATION",
  "partner_code": "{{partner_code}}",
  "partner_secret": "{{partner_secret}}"
}
```

### Example Request (cURL)

```bash
curl --request POST \
  --url '{{base_url}}/api/token' \
  --header 'Content-Type: application/json' \
  --data '{
    "exchange_code": "generated_exchange_code",
    "scope": "SSO_AUTHENTICATION",
    "partner_code": "{{partner_code}}",
    "partner_secret": "{{partner_secret}}"
}'
```

### Responses

| Status | Description |
|---|---|
| 200 OK | Access token successfully generated. |
| 403 Forbidden | Invalid partner credentials or partner not authorized. |
| 422 Unprocessable Entity | The exchange code is invalid or has already been used/expired. |

**200 OK**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**422 Unprocessable Entity**
```json
{
  "message": "Invalid exchange_code",
  "errors": {
    "exchange_code": ["Invalid exchange_code"]
  }
}
```

**403 Forbidden**
```json
{
  "error": "forbidden",
  "message": "You don't have permission to access this resource.",
  "error_description": "You don't have permission to access this resource."
}
```

### Notes
- `exchange_code` is single-use and expires after a short period.
- Store `partner_secret` securely — never expose it client-side.
- Use the returned access token in the `Authorization` header of subsequent requests.

---

## 2. SSO Authentication (Resolve User Profile)

`POST {{base_url}}/api/partner/sso_authentication`

Resolves the authenticated user's profile for a partner application via SSO. Call this after obtaining an access token from `POST /api/token`.

### Authorization

| Type | Details |
|---|---|
| Bearer Token | `Authorization: Bearer {{access_token}}` |

### Request Body
None — the caller is identified entirely by the bearer access token.

### Example Request (cURL)

```bash
curl --request POST \
  --url '{{base_url}}/api/partner/sso_authentication' \
  --header 'Authorization: Bearer {{access_token}}'
```

### Responses

| Status | Description |
|---|---|
| 200 OK | Authentication successful. Returns the authenticated citizen's profile (personal details, national ID, passport, etc.). |
| 401 Unauthorized | The access token is missing, invalid, or expired. |

**200 OK — Response Fields**

Returns a `data` object containing the citizen's profile:

- **Core identity**: `uniqid`, `email`, `birth_date`, `first_name`, `middle_name`, `last_name`, `suffix`, `gender`, `nationality`, `photo`, `mobile`, `signature`, `signature_url`
- **Address**: `address`, `street`, `barangay`, `municipality`, `region`, `province`, `country`, `country_alpha_2_code`, `country_alpha_3_code`, `postal`, `address_line_2`, `barangay_code`, `municipality_code`, `region_code`, `country_id`, `foreign_address`
- **`additional_information`**: nested object with `health_data` (weight, height, eyes_color, complexion), `birth_place`, `other_personal_information` (marital_status, religion), `mother_details`, `father_details`, `emergency_information`, `industry`, `occupation`, `expected_salary`, `educational_attainment` (array)
- **`passport`**: passport_number, place_issued, issued_date, expiry_date, plus name/gender/birth_date fields
- **`national_id`**: `code`, `pcn`, `face_url`, `signature`
- **`tin_id`**: TIN identifier (nullable)

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "uniqid": "MVPCBEUVCGPZR",
    "email": "josie@yopmail.com",
    "first_name": "JOSIE",
    "last_name": "DELA CRUZ",
    "national_id": {
      "code": "XXX001",
      "pcn": "9639954762664080"
    }
  }
}
```

> Note: full sample response includes extensive PII (health data, family details, address, passport, national ID). Handle and store this data per Data Privacy Act (RA 10173) requirements — avoid persisting more than your integration actually needs.

### Notes
- Obtain the access token first from `POST /api/token`.

---

## Endpoint Summary

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/token` | POST | Exchange authorization code for access token |
| `/api/partner/sso_authentication` | POST | Resolve authenticated citizen profile via access token |
