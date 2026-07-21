# eReport Integration API Documentation

Base URL: `{{base}}`

This document describes the eReport integration API, which allows external systems to authenticate, look up PSA-standard location datasets, submit complaint reports, verify complainant emails via OTP, and retrieve submitted report data.

## Table of Contents

1. [Authentication](#authentication)
2. [Generate Token](#1-generate-token)
3. [Datasets](#datasets)
   - [Report Type List](#2-report-type-list)
   - [Region List](#3-region-list)
   - [Province List by Params](#4-province-list-by-params)
   - [Municipality List by Params](#5-municipality-list-by-params)
   - [Barangay List by Params](#6-barangay-list-by-params)
4. [Submit Complaint](#7-submit-complaint)
5. [Email Verification](#email-verification)
   - [Verify - Request OTP](#8-verify---request-otp)
   - [Verify - Confirm OTP](#9-verify---confirm-otp)
6. [Reports](#reports)
   - [Reports List](#10-reports-list)
   - [View Report by Case Number](#11-view-report-by-case-number)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Error Handling](#error-handling)

---

## Authentication

The eReport API uses two distinct authentication mechanisms depending on the endpoint:

| Mechanism | Header | Used For |
|---|---|---|
| Bearer Token | `Authorization: Bearer {{integration_token}}` | Datasets, complaint submission, OTP flow |
| View Token | `X-EReport-View-Token: {{integration_report_view_token}}` | Reading/viewing submitted reports |

The `integration_token` is obtained via the [Generate Token](#1-generate-token) endpoint using a pre-issued `access_code`. The `integration_report_view_token` is obtained after a complainant completes the [OTP verification flow](#email-verification).

---

## 1. Generate Token

Generates an integration access token used to authenticate subsequent API requests.

**POST** `{{base}}/api/integration/token`

### Request Body

| Parameter | Type | Required | Description |
|---|---|---|---|
| `access_code` | string | Yes | A pre-issued access code that identifies and authorizes the integration. |

```json
{
  "access_code": "{{access_code}}"
}
```

### Response — 200 OK

```json
{
  "access_token": "00000000-0000-0000-0000-000000000000",
  "expires_at": "2026-07-19T23:08:06.672+08:00"
}
```

> **Automation note:** The `access_token` returned here should be captured and stored as the `integration_token` environment variable for use in all subsequent authenticated requests.

### cURL Example

```bash
curl --request POST \
  --url '{{base}}/api/integration/token' \
  --header 'Content-Type: application/json' \
  --data '{
    "access_code": "{{access_code}}"
}'
```

### Response — 401 Unauthorized

```json
{
  "code": 401,
  "message": "Invalid access code."
}
```

---

## Datasets

The dataset endpoints expose PSA (Philippine Statistics Authority) standard geographic reference data — regions, provinces, municipalities, and barangays — along with report type definitions. These are cascading: region → province → municipality → barangay.

---

### 2. Report Type List

Retrieves all available report type definitions that can be referenced when submitting or filtering reports.

**GET** `{{base}}/api/integration/datasets/report_types`

**Auth:** Bearer Token (`{{integration_token}}`)

#### Parameters

None.

#### Response — 200 OK

Returns a paginated JSON:API-style list of report type objects.

```json
{
  "jsonapi": { "version": "1.0" },
  "meta": {
    "pagination": {
      "total": 9,
      "per_page": 25,
      "current_page": 1,
      "total_pages": 1
    }
  },
  "data": [
    {
      "type": "report_types",
      "id": "0ef6d51a-75be-4ff5-9259-e7f080504f48",
      "attributes": {
        "code": "crime",
        "name": "Crime",
        "sequence": 1,
        "is_visible": true,
        "is_active": true,
        "created_at": "Nov 04, 2025 06:28:54 PM",
        "updated_at": null
      }
    }
  ]
}
```

**Known report type codes:** `crime`, `red_tape`, `scam`, `child_abuse`, `women_abuse`, `overpricing`, `fire`, `accident`, `gas_station_concerns`.

#### cURL Example

```bash
curl --request GET \
  --url '{{base}}/api/integration/datasets/report_types' \
  --header 'Authorization: Bearer {{integration_token}}'
```

#### Errors

`401 Unauthorized` — token invalid or expired.
`500 Internal Server Error` — server-side processing error.

##### Response — 401 Unauthorized

```json
{
  "code": 401,
  "message": "Missing or invalid Authorization header."
}
```

---

### 3. Region List

Retrieves all available regions.

**GET** `{{base}}/api/integration/datasets/regions`

**Auth:** Bearer Token (`{{integration_token}}`)

#### Parameters

None.

#### Response — 200 OK

```json
{
  "jsonapi": { "version": "1.0" },
  "data": [
    {
      "type": "regions",
      "id": "010000000",
      "attributes": { "name": "REGION I (ILOCOS REGION)" }
    },
    {
      "type": "regions",
      "id": "130000000",
      "attributes": { "name": "NATIONAL CAPITAL REGION (NCR)" }
    }
  ]
}
```

The response includes all 18 PSA-defined regions of the Philippines (Region I through Region XIII, NCR, CAR, ARMM, MIMAROPA, and NIR).

#### cURL Example

```bash
curl --request GET \
  --url '{{base}}/api/integration/datasets/regions' \
  --header 'Authorization: Bearer {{integration_token}}'
```

#### Errors

`401 Unauthorized` / `403 Forbidden` — missing, invalid, or insufficiently privileged token.
`500 Internal Server Error` — unexpected server error.

##### Response — 401 Unauthorized

```json
{
  "code": 401,
  "message": "Missing or invalid Authorization header."
}
```

---

### 4. Province List by Params

Retrieves provinces filtered by region code.

**GET** `{{base}}/api/integration/datasets/provinces?region_code={region_code}`

**Auth:** Bearer Token (`{{integration_token}}`)

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `region_code` | string | Yes | The region code used to filter provinces (e.g. `040000000`) |

#### Response — 200 OK

```json
{
  "jsonapi": { "version": "1.0" },
  "data": [
    {
      "type": "provinces",
      "id": "042100000",
      "attributes": {
        "region_code": "040000000",
        "name": "CAVITE",
        "district": null
      }
    }
  ]
}
```

#### cURL Example

```bash
curl --request GET \
  --url '{{base}}/api/integration/datasets/provinces?region_code=040000000' \
  --header 'Authorization: Bearer {{integration_token}}'
```

#### Errors

`401 Unauthorized` — invalid or missing region code / token.

##### Response — 401 Unauthorized

```json
{
  "code": 401,
  "message": "Missing or invalid Authorization header."
}
```

---

### 5. Municipality List by Params

Retrieves municipalities filtered by province code.

**GET** `{{base}}/api/integration/datasets/municipalities?province_code={province_code}`

**Auth:** Bearer Token (`{{integration_token}}`)

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `province_code` | string | Yes | The province code used to filter municipalities (e.g. `042100000`) |

#### Response — 200 OK

```json
{
  "jsonapi": { "version": "1.0" },
  "data": [
    {
      "type": "municipalities",
      "id": "042111000",
      "attributes": {
        "region_code": "040000000",
        "province_code": "042100000",
        "name": "KAWIT",
        "zip_code": null
      }
    }
  ]
}
```

#### cURL Example

```bash
curl --request GET \
  --url '{{base}}/api/integration/datasets/municipalities?province_code=042100000' \
  --header 'Authorization: Bearer {{integration_token}}'
```

#### Errors

`401 Unauthorized` — invalid or missing `province_code` / token.

##### Response — 401 Unauthorized

```json
{
  "code": 401,
  "message": "Missing or invalid Authorization header."
}
```

---

### 6. Barangay List by Params

Retrieves barangays filtered by municipality code.

**GET** `{{base}}/api/integration/datasets/barangays?municipality_code={municipality_code}`

**Auth:** Bearer Token (`{{integration_token}}`)

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `municipality_code` | string | Yes | The code of the municipality to filter barangays by (e.g. `042111000`) |

#### Response — 200 OK

```json
{
  "jsonapi": { "version": "1.0" },
  "data": [
    {
      "type": "barangays",
      "id": "042111011",
      "attributes": {
        "region_code": "040000000",
        "province_code": "042100000",
        "municipality_code": "042111000",
        "name": "Toclong",
        "zip_code": null
      }
    }
  ]
}
```

#### cURL Example

```bash
curl --request GET \
  --url '{{base}}/api/integration/datasets/barangays?municipality_code=042111000' \
  --header 'Authorization: Bearer {{integration_token}}'
```

#### Errors

`401 Unauthorized` — invalid or missing `municipality_code` / token.

##### Response — 401 Unauthorized

```json
{
  "code": 401,
  "message": "Missing or invalid Authorization header."
}
```

---

## 7. Submit Complaint

Submits a new complaint report to the eReport system, including complainant details, report classification, optional evidence attachments, and geographic location.

**POST** `{{base}}/api/integration/submit_complaint`

**Auth:** Bearer Token (`{{integration_token}}`)

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `mobile` | string | Yes | Mobile number of the complainant (e.g. `639XXXXXXXXX`) |
| `first_name` | string | Yes | First name of the complainant |
| `last_name` | string | Yes | Last name of the complainant |
| `gender` | string | Yes | Gender of the complainant (e.g. `Male`, `Female`) |
| `complainant_email` | string | Yes | Email address of the complainant |
| `report_type` | string | Yes | Report category code (see [Report Type List](#2-report-type-list), e.g. `crime`) |
| `subject` | string | Yes | Brief subject/title of the complaint |
| `message` | string | Yes | Detailed description of the complaint |
| `evidences` | array of strings | No | List of image URLs to attach as evidence |
| `region_code` | string | Yes | PSA region code of the incident location |
| `province_code` | string | Yes | PSA province code of the incident location |
| `municipality_code` | string | Yes | PSA municipality/city code of the incident location |
| `barangay_code` | string | Yes | PSA barangay code of the incident location |
| `latitude` | string | No | Latitude coordinate of the incident location |
| `longitude` | string | No | Longitude coordinate of the incident location |

### Example Request Body

```json
{
  "mobile": "639999999999",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "gender": "Male",
  "complainant_email": "juan.delacruz@email.com",
  "report_type": "crime",
  "subject": "Test subject",
  "message": "Test message",
  "evidences": [
    "https://yavuzceliker.github.io/sample-images/image-1021.jpg"
  ],
  "region_code": "040000000",
  "province_code": "042100000",
  "municipality_code": "042111000",
  "barangay_code": "042111011",
  "latitude": "14.60",
  "longitude": "120.98"
}
```

### Response — 200 OK

```json
{
  "code": 200,
  "message": "We received your report. We'll get back to you.",
  "case_number": "PFM-071826-0014"
}
```

The `case_number` returned is a unique identifier for the submitted report, used later with [Reports List](#10-reports-list) or [View Report by Case Number](#11-view-report-by-case-number).

### cURL Example

```bash
curl --request POST \
  --url '{{base}}/api/integration/submit_complaint' \
  --header 'Authorization: Bearer {{integration_token}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "mobile": "639999999999",
    "first_name": "Juan",
    "last_name": "Dela Cruz",
    "gender": "Male",
    "complainant_email": "juan.delacruz@email.com",
    "report_type": "crime",
    "subject": "Test subject",
    "message": "Test message",
    "evidences": [
        "https://yavuzceliker.github.io/sample-images/image-1021.jpg"
    ],
    "region_code": "040000000",
    "province_code": "042100000",
    "municipality_code": "042111000",
    "barangay_code": "042111011",
    "latitude": "14.60",
    "longitude": "120.98"
}'
```

### Errors

`401 Unauthorized` — missing/invalid required fields, or invalid token.

#### Response — 401 Unauthorized

```json
{
  "code": 401,
  "message": "Missing or invalid Authorization header."
}
```

---

## Email Verification

Before a complainant can view report status/history, their email must be verified through a two-step OTP flow: request an OTP, then confirm it. A successful confirmation issues a `report_view_token`.

---

### 8. Verify - Request OTP

Initiates an OTP verification flow by sending a one-time password to the specified email address. This is the first step in email verification.

**POST** `{{base}}/api/integration/verify/request`

**Auth:** Bearer Token (`{{integration_token}}`)

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | Yes | The email address to which the OTP will be sent |

```json
{
  "email": "juan.delacruz@email.com"
}
```

### Response — 200 OK

```json
{
  "code": 200,
  "already_verified": false,
  "message": "A 6-digit verification code has been sent to juan.delacruz@email.com. It expires in 5 minutes."
}
```

The OTP expires **5 minutes** after issuance.

### cURL Example

```bash
curl --request POST \
  --url '{{base}}/api/integration/verify/request' \
  --header 'Authorization: Bearer {{integration_token}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "juan.delacruz@email.com"
}'
```

### Errors

`401 Unauthorized` — email missing, malformed, or not associated with a valid account.

#### Response — 401 Unauthorized

```json
{
  "code": 401,
  "message": "Missing or invalid Authorization header."
}
```

---

### 9. Verify - Confirm OTP

Confirms the OTP sent to a user's email as part of the verification flow. On success, returns a `report_view_token`.

**POST** `{{base}}/api/integration/verify/confirm`

**Auth:** Bearer Token (`{{integration_token}}`)

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | Yes | The email address associated with the integration account |
| `otp` | string | Yes | The one-time password received via email |

```json
{
  "email": "juan.delacruz@email.com",
  "otp": "000000"
}
```

### Response — 200 OK

```json
{
  "code": 200,
  "report_view_token": "00000000-0000-0000-0000-000000000000",
  "expires_at": "2026-07-19T01:36:59.944+08:00"
}
```

> **Automation note:** The `report_view_token` returned should be captured and stored as the `integration_report_view_token` environment variable, required by the [Reports](#reports) endpoints below.

### cURL Example

```bash
curl --request POST \
  --url '{{base}}/api/integration/verify/confirm' \
  --header 'Authorization: Bearer {{integration_token}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "juan.delacruz@email.com",
    "otp": "000000"
}'
```

### Errors

`401 Unauthorized` — invalid or expired OTP.

#### Response — 401 Unauthorized

```json
{
  "code": 401,
  "message": "Missing or invalid Authorization header."
}
```

---

## Reports

Endpoints for browsing and retrieving submitted reports. These require the `X-EReport-View-Token` header rather than a Bearer token.

---

### 10. Reports List

Retrieves a paginated list of reports available to the integration.

**GET** `{{base}}/api/integration/reports`

**Auth:** `X-EReport-View-Token: {{integration_report_view_token}}`

### Query Parameters

| Parameter | Default | Description |
|---|---|---|
| `q` | — | Optional search/filter string to narrow down results |
| `page` | `1` | Page number for pagination |
| `limit` | `25` | Number of reports to return per page |

### Response — 200 OK

```json
{
  "jsonapi": { "version": "1.0" },
  "meta": {
    "pagination": {
      "total": 1,
      "per_page": 25,
      "current_page": 1,
      "total_pages": 1
    }
  },
  "data": [
    {
      "type": "reports",
      "id": "00000000-0000-0000-0000-000000000000",
      "attributes": {
        "case_number": "PFM-071826-0014",
        "complainant": {
          "first_name": "Erick",
          "last_name": "Mann",
          "fullname": "Erick Mann",
          "phone_number": "639000000000",
          "gender": "Male",
          "email": "juan.delacruz@example.com"
        },
        "report_type": {
          "id": "0ef6d51a-75be-4ff5-9259-e7f080504f48",
          "code": "crime",
          "name": "Crime",
          "img_url": null
        },
        "subject": "consequatur",
        "message": "Quaerat consequatur vel eaque est ea nobis.",
        "evidences": [
          "http://placeimg.com/640/480",
          "http://placeimg.com/640/480"
        ],
        "address": {
          "region": { "code": "040000000", "name": "REGION IV-A (CALABARZON)" },
          "province": { "code": "042100000", "name": "CAVITE" },
          "municipality": { "code": "042111000", "name": "KAWIT" },
          "barangay": { "code": "042111011", "name": "Toclong" },
          "latitude": "14.60",
          "longitude": "120.98",
          "country_code": "PH",
          "country_name": "Philippines"
        },
        "status": "PENDING",
        "formatted_status": "Pending",
        "history": [],
        "created_at": "Jul 18, 2026 11:41:22 PM"
      }
    }
  ]
}
```

### cURL Example

```bash
curl --request GET \
  --url '{{base}}/api/integration/reports' \
  --header 'X-EReport-View-Token: {{integration_report_view_token}}'
```

### Errors

`401 Unauthorized` — token invalid or missing.

#### Response — 401 Unauthorized

```json
{
  "code": 401,
  "message": "Missing X-EReport-View-Token header."
}
```

---

### 11. View Report by Case Number

Retrieves the full details of a specific report using its case number.

**GET** `{{base}}/api/integration/reports/:case_number`

**Auth:** `X-EReport-View-Token: {{integration_report_view_token}}`

### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `case_number` | string | Yes | The unique case number of the report to retrieve (e.g. `PFM-071826-0014`) |

### Response — 200 OK

```json
{
  "data": {
    "id": "00000000-0000-0000-0000-000000000000",
    "case_number": "PFM-071826-0014",
    "complainant": {
      "first_name": "Erick",
      "last_name": "Mann",
      "fullname": "Erick Mann",
      "phone_number": "639000000000",
      "gender": "Male",
      "email": "juan.delacruz@example.com"
    },
    "report_type": {
      "id": "0ef6d51a-75be-4ff5-9259-e7f080504f48",
      "code": "crime",
      "name": "Crime",
      "img_url": null
    },
    "subject": "consequatur",
    "message": "Quaerat consequatur vel eaque est ea nobis.",
    "evidences": [
      "http://placeimg.com/640/480",
      "http://placeimg.com/640/480"
    ],
    "address": {
      "region": { "code": "040000000", "name": "REGION IV-A (CALABARZON)" },
      "province": { "code": "042100000", "name": "CAVITE" },
      "municipality": { "code": "042111000", "name": "KAWIT" },
      "barangay": { "code": "042111011", "name": "Toclong" },
      "latitude": "14.60",
      "longitude": "120.98",
      "country_code": "PH",
      "country_name": "Philippines"
    },
    "status": "PENDING",
    "formatted_status": "Pending",
    "history": [
      {
        "status": "PENDING",
        "formatted_status": "Pending",
        "remarks": null,
        "created_at": "Jul 18, 2026 11:41:22 PM"
      }
    ],
    "created_at": "Jul 18, 2026 11:41:22 PM"
  }
}
```

### cURL Example

```bash
curl --request GET \
  --url '{{base}}/api/integration/reports/:case_number' \
  --header 'X-EReport-View-Token: {{integration_report_view_token}}'
```

### Errors

`401 Unauthorized` / `404 Not Found` — report not found, or token invalid.

#### Response — 401 Unauthorized

```json
{
  "code": 401,
  "message": "Missing X-EReport-View-Token header."
}
```

---

## Environment Variables Reference

| Variable | Description | Set By |
|---|---|---|
| `base` | Base URL of the eReport API (e.g. `https://api.example.com`) | Manually configured |
| `access_code` | Pre-issued code identifying and authorizing the integration | Manually configured |
| `integration_token` | Bearer token for authenticating integration API requests | [Generate Token](#1-generate-token) response |
| `integration_report_view_token` | Token used to authorize report viewing/browsing | [Verify - Confirm OTP](#9-verify---confirm-otp) response |

---

## Error Handling

Across all endpoints, common error status codes include:

| Status | Meaning |
|---|---|
| `401 Unauthorized` | Token missing, invalid, or expired |
| `403 Forbidden` | Token lacks sufficient permissions |
| `404 Not Found` | Requested resource (e.g. report) does not exist |
| `500 Internal Server Error` | Unexpected server-side error |

---

## Typical Integration Flow

1. **Generate Token** — exchange your `access_code` for an `integration_token`.
2. **Look up datasets** — use Report Type / Region / Province / Municipality / Barangay endpoints to populate location and category selectors.
3. **Submit Complaint** — send the complaint payload using the resolved codes; receive a `case_number`.
4. **Verify email** (optional, for report viewing) — request an OTP, then confirm it to receive a `report_view_token`.
5. **View Reports** — use the `report_view_token` to list reports or fetch a specific report by `case_number`.
