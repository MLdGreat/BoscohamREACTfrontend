# Boscoham Properties API

Boscoham Properties is a Node.js/Express API for property and apartment listings, shortlets, bookings, stays, tenants, tenancies, and viewing requests. This document is the integration reference for the browser-based admin frontend.

## Run locally

Requirements: Node.js, PostgreSQL, Redis, Supabase Storage, and a Resend account for email features.

```bash
npm install
npm start
```

For automatic restarts during development:

```bash
npm run dev
```

The default API base URL is `http://localhost:2000`. Create `config.env` in the repository root and keep credentials out of source control:

```env
DATABASE_CONNECTION_STRING=postgresql://USER:PASSWORD@HOST:5432/DATABASE
SESSION_SECRET_KEY=replace-with-a-long-random-secret
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM="Boscoham <noreply@example.com>"
NODE_ENV=development
PORT=2000
CORS_ORIGIN=http://localhost:5173
# Production frontend origin used for password-reset links
PRODUCTION_FRONTEND_DOMAIN=https://admin.example.com
```

The server checks the database before listening. Redis is used for sessions and idempotency. The browser origin must exactly match one of the comma-separated values in `CORS_ORIGIN`.

## Frontend request conventions

Authentication uses an HTTP-only session cookie. Send `credentials: 'include'` on browser requests, including login, logout, and admin API calls. Never read or set the cookie in frontend code.

```js
const API_BASE = 'http://localhost:2000/api';

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  const body = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    const error = new Error(body?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.body = body;
    error.requestId = response.headers.get('x-request-id');
    throw error;
  }
  return body;
}
```

For `FormData`, do not set `Content-Type` yourself; the browser adds the multipart boundary. Successful responses usually have `{ "status": "success", "data": ... }`, but some include `message`, and a few legacy handlers vary capitalization or use another error shape. A `204` response has no JSON body.

| HTTP status | Frontend handling |
| --- | --- |
| 200 / 201 | Success; use the response body where supplied |
| 204 | Success with no response body |
| 400 | Invalid input, ID, or query value |
| 401 | No valid logged-in session, or endpoint-specific credential failure |
| 403 | Logged-in user is not an admin |
| 404 | Record or referenced resource not found |
| 409 | Date overlap, booking conflict, or dependent-record conflict |
| 422 | Idempotency key reused for a different request |
| 503 | Idempotency service unavailable |
| 500 | Unexpected/server/database error |

The server returns an `x-request-id` header for support and log tracing. API traffic is rate-limited (300 requests per 15 minutes); auth traffic has a 30-request per 15-minute limit.

## Session and access

| Method | Endpoint | Access | Request | Success |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | JSON: `first_name`, `last_name`, `email`, `password`, `confirmPassword` | 201 with message |
| POST | `/api/auth/login` | Public | JSON: `email`, `password` | 200 with message; creates session |
| POST | `/api/auth/logout` | Public | No body | 200 with message; clears session |
| GET | `/api/auth/me` | Session | No body | 200 with `{data:{email,role}}` |
| POST | `/api/auth/forgot-password` | Public | JSON: `email` | 200 generic result |
| POST | `/api/auth/reset-password` | Public | JSON: `password`, `confirmPassword`; reset token in query string or JSON body | 200 with message |
| POST | `/api/auth/reset-password/:token` | Public | JSON: `password`, `confirmPassword` (legacy token format) | 200 with message |
| GET | `/api/users?page=1&limit=10` | Admin | Paginated user directory; excludes password hashes |
| POST | `/api/users` | Admin | Creates an admin account using signup fields; role is assigned by the server |

The forgot-password email links to the frontend root in the form `https://<admin-frontend-domain>/?token=<reset-token>`. In production, set `PRODUCTION_FRONTEND_DOMAIN` to the admin frontend origin (scheme and host, without an API path). If it is unset, the first origin in `CORS_ORIGIN` is used. Locally, reset links point to `http://localhost:5173/?token=<reset-token>`.

The frontend should read `token` from the page URL and submit the new password to `POST /api/auth/reset-password?token=<reset-token>` with JSON `{ "password": "...", "confirmPassword": "..." }`. The token may also be included in the JSON body as `token`; the `/:token` route remains available for existing path-based links. Reset tokens expire after 30 minutes and can only be used once.

Signup and login require a valid `.com`, `.net`, `.org`, or `.io` email. Passwords must be 8-30 characters and include uppercase, lowercase, number, and one of `@$!%*?&`. Signup additionally requires matching `confirmPassword`. Public signup cannot grant admin access. An authenticated admin can create admin accounts through `POST /api/users`; the server always assigns the `admin` role and ignores a submitted `role`. Provision the first admin through the project's trusted operational process.

`admin` below means a logged-in session whose role is exactly `admin`. Missing sessions return 401; other roles return 403. `session` means any logged-in user. `public` means no authentication middleware is attached.

## Admin API route catalog

### Properties

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/properties?page=1&limit=10` | Public | Paginated properties, including images |
| POST | `/api/properties` | Admin | Multipart create; requires `Idempotency-Key` |
| PATCH | `/api/properties/:id` | Admin | Multipart update; image replacement occurs when new images are sent |
| DELETE | `/api/properties/:id` | Admin | Returns a success message |

Property create fields: required `title`, `city`, `state`, `address`, `type`, `price`, `description`, `highlighted`; optional `features`, `beds`, `baths`; image field `image` (up to 10 images, 5 MB each). `features` is a JSON array string of unique non-empty strings, or `null`. Images must be JPG, PNG, or WEBP. Update accepts a subset of property fields and/or images; send at least one change. Sending images replaces the current property image set. Create returns `data` as the inserted property row; list rows include an `images` array. The property list accepts `page` and `limit` query parameters, defaults to page 1 with 10 records, and returns pagination metadata as described below.

### Apartments and apartment units

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/apartments` | Public | Apartments with nested units and images |
| POST | `/api/apartments` | Admin | Multipart create; requires `Idempotency-Key` |
| PATCH | `/api/apartments/:id` | Admin | Update fields and/or append parent images |
| DELETE | `/api/apartments/:id` | Admin | 409 if tenancies still depend on the apartment |
| PATCH | `/api/apartments/:id/units/:unitId` | Admin | Update unit fields and/or append unit images |
| DELETE | `/api/apartments/:id/units/:unitId` | Admin | 409 if tenancies still depend on the unit |

Apartment create is multipart. Required text fields are `title`, `description`, `city`, `state`, `address`, and `units`; `units` is a JSON array string. Optional `features` is a JSON array string. Parent images use `image`; unit images use a distinct field `unitImages[<clientUnitId>]` for each client-generated unit UUID. Up to 20 JPG/PNG/WEBP images of 5 MB each may be sent across the request.

```json
[
  {
    "clientUnitId": "a2d8d52d-57b9-49d9-b8df-6e3e2e7bc6d6",
    "imageField": "unitImages[a2d8d52d-57b9-49d9-b8df-6e3e2e7bc6d6]",
    "unitNumber": "A1",
    "bedrooms": 2,
    "bathrooms": 2,
    "price": 250000,
    "availability": "available"
  }
]
```

Each unit requires a UUID `clientUnitId`, `imageField`, `unitNumber`, positive integer `bedrooms` and `bathrooms`, and a nonnegative integer `price`. `availability` accepts `available` or `taken`. The create response returns `data.apartment`; fetch the apartment list to obtain its created units and images. Apartment updates append parent images. Unit updates accept `unit_name`, `price`, `bedroom`, `bathroom`, `availability`, and optional images; at least one field or image is required.

### Shortlets and shortlet units

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/shortlets` | Public | Shortlets with nested units and images |
| POST | `/api/shortlets` | Admin | Multipart create; requires `Idempotency-Key` |
| GET | `/api/shortlets/:id` | Public | One shortlet with nested units and images |
| PATCH | `/api/shortlets/:id` | Admin | JSON subset: `title`, `city`, `state`, `address`, `features` |
| DELETE | `/api/shortlets/:id` | Admin | 409 if bookings depend on the shortlet |
| GET | `/api/shortlets/:id/units` | Public | Units for a shortlet |
| POST | `/api/shortlets/:id/units` | Admin | JSON create; requires `Idempotency-Key` |
| PATCH | `/api/shortlets/:id/units/:unitId` | Admin | JSON partial update |
| DELETE | `/api/shortlets/:id/units/:unitId` | Admin | 409 if bookings depend on the unit |

Shortlet create is multipart with required `title`, `city`, `state`, `address`, and `units`; optional `features` is a JSON array string. Use `image` for parent images and `unitImages[<clientUnitId>]` for unit images. A unit object has `clientUnitId` (UUID), `imageField`, `title`, integer `price`, integer `bedrooms`, integer `bathrooms`, and `availability` (`available` or `taken`). Images accept JPG/PNG/WEBP, at most 20 files and 5 MB each.

Standalone shortlet unit creation takes JSON fields `title`, positive `price_per_night`, nonnegative integer `bedroom`, nonnegative integer `bathroom`, and `availability`. Unit updates accept a nonempty subset of those same fields. Parent and unit creates return the created parent/unit row; fetch the list/detail endpoint for the full nested representation.

### Bookings and stays

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/bookings?page=1&limit=10&sortBy=booking_status&sortOrder=asc` | Admin | Paginated booking queue; includes `shortlet_title` and `shortlet_unit_title` |
| POST | `/api/bookings` | Public (optional session) | Create booking; requires `Idempotency-Key` |
| PATCH | `/api/bookings/accept/:id` | Admin | Confirms booking and creates/updates its stay |
| PATCH | `/api/bookings/reject/:id` | Admin | Rejects booking |
| POST | `/api/payments/initialize` | Session | Initialize Paystack payment for the signed-in user's pending booking; requires `Idempotency-Key` |
| POST | `/api/payments/verify` | Session | Verify a payment reference owned by the signed-in user against Paystack |
| GET | `/api/payments/shortlet-revenue?period=daily` | Admin | Revenue and successful booking counts grouped by UTC day, week, month, or year |
| GET | `/api/stays?page=1&limit=20` | Admin | Read stays; refreshes date-derived statuses |

Booking create JSON uses camelCase dates. The handler does not require login; if a valid session exists, its user ID is attached automatically. Do not send `user_id`. `contact_email` is required for booking confirmation emails.

```json
{
  "shortlet_unit_id": "00000000-0000-0000-0000-000000000000",
  "first_name": "Jane",
  "last_name": "Doe",
  "contact_email": "jane@example.com",
  "notes": "Late arrival",
  "checkIn": "2026-11-01T15:00:00.000Z",
  "checkOut": "2026-11-05T11:00:00.000Z",
  "amount": 120000
}
```

The booking starts `pending`. Date overlap on the same unit returns 409. The accept/reject routes take no body. A successful acceptance returns the booking row; it does not include the stay row. The stay is generated only on confirmation, linked to the booking, and its status follows its schedule: `pending` before check-in, `active` from check-in until checkout, and `completed` at/after checkout. The stay listing reconciles statuses when read; there is no separate stay create/update/delete endpoint. The existing `terminated` stay status is preserved by this refresh.

#### Shortlet booking notifications

The customer receives a confirmation email only after both the booking status is `confirmed` and at least one linked payment is `successful`. This works regardless of which condition happens first. Apply [migrations/20261101_add_shortlet_booking_notifications.sql](migrations/20261101_add_shortlet_booking_notifications.sql) to add the booking contact email and retryable notification outbox. The worker polls every 30 seconds, and failed sends are retried after one minute. Existing bookings cannot be notified unless their contact email is populated.

Configure Resend with `RESEND_API_KEY` and `EMAIL_FROM` to send booking confirmation emails.

#### Payments

Payment initialization and verification require a logged-in session. The booking must belong to that user and still have `pending` booking status. The server uses the booking's stored amount and the account email; do not send an amount or email from the browser.

Before enabling these endpoints, apply [migrations/20261031_add_payment_reference.sql](migrations/20261031_add_payment_reference.sql) and configure `PAYSTACK_TEST_SECRET_KEY` and `PAYSTACK_CALLBACK_URL` in `config.env`. The migration backfills references for existing payment rows before making the column required and unique.

Initialize with a UUID booking ID and a fresh `Idempotency-Key` for each new payment attempt. Reuse the same key only when retrying the same request. The server creates a unique reference, saves a pending payment, and returns the Paystack authorization URL:

```js
const initialized = await apiRequest('/payments/initialize', {
  method: 'POST',
  headers: { 'Idempotency-Key': crypto.randomUUID() },
  body: JSON.stringify({
    booking_id: '00000000-0000-0000-0000-000000000000',
  }),
});

// Redirect the customer to initialized.authorizationUrl to complete payment.
```

Request JSON:

```json
{
  "booking_id": "00000000-0000-0000-0000-000000000000"
}
```

Successful initialization returns HTTP 200:

```json
{
  "message": "Payment initialized.",
  "authorizationUrl": "https://checkout.paystack.com/example",
  "reference": "BOSCO-example-reference"
}
```

After the customer returns from Paystack, verify using the returned reference. Verification can be called repeatedly and is not wrapped in the Redis idempotency middleware. The payment must belong to the signed-in user.

```js
const verification = await apiRequest('/payments/verify', {
  method: 'POST',
  body: JSON.stringify({ reference: initialized.reference }),
});
```

Request JSON (reference must be a non-empty string of at most 200 characters):

```json
{
  "reference": "BOSCO-example-reference"
}
```

Verification returns HTTP 200 when Paystack confirms the transaction details match the stored reference, amount, and NGN currency. The response's `data.payment_status` is `successful`, `failed`, `pending`, or `refunded` (when the payment was already refunded); pending, failed, and refunded are not successful payments. A successful response looks like:

```json
{
  "message": "Payment verified successfully.",
  "data": {
    "reference": "BOSCO-example-reference",
    "amount": "120000.00",
    "payment_status": "successful",
    "paid_at": "2026-10-31T12:00:00.000Z"
  }
}
```

Admins can read shortlet revenue with `GET /api/payments/shortlet-revenue?period=<period>`. `period` is required and accepts `daily`, `weekly`, `monthly`, or `yearly`. Only payments with `payment_status: "successful"` and a `paid_at` timestamp are included; buckets use the payment time in UTC, and weekly buckets start on Monday. `totalRevenue` is the all-time total for the selected grouping, while `buckets` omits periods with no successful payments. Revenue amounts are in NGN.

```json
{
  "status": "success",
  "data": {
    "period": "monthly",
    "currency": "NGN",
    "totalRevenue": "245000.00",
    "buckets": [
      {
        "periodStart": "2026-10-01T00:00:00.000Z",
        "revenue": "120000.00",
        "successfulBookings": 1
      },
      {
        "periodStart": "2026-11-01T00:00:00.000Z",
        "revenue": "125000.00",
        "successfulBookings": 1
      }
    ]
  }
}
```

An unsupported or missing period returns HTTP 400. Requests without an admin session return HTTP 401 or 403.

Initialization can return 400 for an invalid booking ID, 401 without a session, 404 when the booking/account is unavailable, or 409 when the booking is not payable or already paid. Verification can return 400 for an invalid reference, 401 without a session, 404 when no owned payment has that reference, or 502 when Paystack cannot verify it or the returned details do not match. Treat only `payment_status: "successful"` as paid. Database and other unexpected errors use the normal server error response.

Booking pagination defaults to page 1 and limit 10; `limit` must be an integer from 1 to 100. These are collection query parameters, so the admin frontend can request `/api/bookings?page=1&limit=10&sortBy=booking_status&sortOrder=asc`. Increment `page` to fetch the next page while preserving the other query parameters. The response includes pagination metadata (`total`, `totalPages`, `hasNext`, `hasPrevious`, `nextPage`, and `previousPage`) so the client can enable or disable navigation controls. `sortBy` accepts `booking_status` or `created_at`; `sortOrder` accepts `asc` or `desc`. The default is `booking_status` ascending, ordered pending, confirmed, rejected, cancelled, no-show, then completed; bookings with the same status are ordered newest first. Each row includes booking fields, `shortlet_title` for the parent listing, and `shortlet_unit_title` for the booked flat/unit. Use the unit title when showing which flat was booked; the two names are not interchangeable. For example:

```json
{
  "status": "success",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 24,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false,
    "nextPage": 2,
    "previousPage": null
  },
  "data": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "shortlet_unit_id": "11111111-1111-1111-1111-111111111111",
      "first_name": "Jane",
      "last_name": "Doe",
      "notes": "Late arrival",
      "amount": "120000.00",
      "check_in": "2026-11-01T15:00:00.000Z",
      "check_out": "2026-11-05T11:00:00.000Z",
      "booking_status": "pending",
      "shortlet_title": "Central City Apartments",
      "shortlet_unit_title": "Flat 4B"
    }
  ]
} 
```

Stay pagination defaults to page 1 and limit 10 and validates `page >= 1`, `1 <= limit <= 100`.

Bookings, stays, properties, and viewings use the same page-based response contract. List requests accept `page` (default 1) and `limit` (default 10, range 1-100) as query parameters. Responses include `pagination.page`, `pagination.limit`, `pagination.total`, `pagination.totalPages`, `pagination.hasNext`, `pagination.hasPrevious`, `pagination.nextPage`, and `pagination.previousPage`, alongside the list in `data`. To load the next page, request the same endpoint with `page` set to `pagination.nextPage`, keeping `limit` and any sorting options unchanged. Viewings additionally accepts legacy `offset`; when it is used, pagination metadata includes `offset`, `nextOffset`, and `previousOffset` (page links are `null`).

Stay schema prerequisite: the booking confirmation model inserts `stays.booking_id` and uses a partial unique constraint target to avoid duplicate stays. `schema.dbml` describes the column, but the checked-in migrations directory currently contains no migration for it. Before enabling booking acceptance on a database that lacks this setup, apply an equivalent migration:

```sql
ALTER TABLE stays ADD COLUMN IF NOT EXISTS booking_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stays_booking_id_fkey'
      AND conrelid = 'stays'::regclass
  ) THEN
    ALTER TABLE stays
      ADD CONSTRAINT stays_booking_id_fkey
      FOREIGN KEY (booking_id) REFERENCES bookings(id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stays_booking_id_unique
  ON stays (booking_id) WHERE booking_id IS NOT NULL;
```

### Tenants

There are two tenant APIs with different validation and response behavior. The admin UI should use `/api/tenants` for the paginated list and standard tenant create, and `/api/admin/tenants` for edit/delete.

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/tenants?limit=10&offset=0` | Admin | Paginated list; limit 1-50 |
| POST | `/api/tenants` | Admin | Create; no idempotency middleware |
| GET | `/api/admin/tenants` | Admin | Unpaginated tenant list |
| GET | `/api/admin/` | Admin | Also returns tenants (legacy route) |
| POST | `/api/admin/tenants` | Admin | Alternate create; requires `Idempotency-Key` |
| PATCH | `/api/admin/tenants/:id` | Admin | Update subset of tenant fields |
| DELETE | `/api/admin/tenants/:id` | Admin | Deletes tenant and their tenancies; returns 204 |

Tenant fields are `first_name`, `last_name`, `email`, and `phone_number`. Standard `POST /api/tenants` requires all four; the admin create requires the names and phone, with email optional. For the standard route, phone must be an international-style number and email is limited to `.com`, `.net`, `.org`, or `.io`. Admin-route patch accepts a nonempty subset, with normal email validation. The two create paths use different validators and response capitalization.

Tenant-to-unit assignment:

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| POST | `/api/tenants/assign/:apartmentUnitId` | Admin | Assign tenant to a specific unit; requires `Idempotency-Key` |

JSON body:

```json
{
  "tenantId": "00000000-0000-0000-0000-000000000000",
  "apartmentId": "00000000-0000-0000-0000-000000000000",
  "move_in": "2026-11-01T00:00:00.000Z",
  "move_out": "2027-10-31T00:00:00.000Z"
}
```

The unit must belong to the supplied apartment; move-out must be after move-in. Existing overlapping tenancies return 409.

`POST /api/admin/assign-tenant/:id` is another mounted assignment route, but its current controller/model wiring does not provide the required apartment unit to the tenancy insert and uses the apartment ID for overlap checking. Prefer `/api/tenants/assign/:apartmentUnitId`; do not build a workflow around the admin alias until that backend route is corrected.

### Tenancies

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/tenancies` | Admin | Unpaginated joined rows for the tenancy table |
| POST | `/api/tenancies` | Admin | Create; requires `Idempotency-Key` |
| GET | `/api/tenancies/:id` | Admin | One raw tenancy row |
| PATCH | `/api/tenancies/:id` | Admin | Nonempty subset of tenancy fields |
| DELETE | `/api/tenancies/:id` | Admin | Returns 204 |

Create JSON (all fields required):

```json
{
  "apartment_id": "00000000-0000-0000-0000-000000000000",
  "apartment_unit_id": "00000000-0000-0000-0000-000000000000",
  "tenant_id": "00000000-0000-0000-0000-000000000000",
  "move_in": "2026-11-01T00:00:00.000Z",
  "move_out": "2027-10-31T00:00:00.000Z"
}
```

The unit must belong to the apartment, the tenant must exist, and `move_out` must be after `move_in`. An overlap for the same unit returns 409. Patch accepts a nonempty subset of the same fields and repeats the reference/date/overlap checks. `GET /api/tenancies` includes apartment title, unit title, tenant name/email, and dates; `GET /api/tenancies/:id` returns stored fields.

### Viewings

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/viewings?page=1&limit=10` | Admin | Paginated; also accepts legacy `offset` |
| POST | `/api/viewings` | Session | Create request; requires `Idempotency-Key` |
| POST | `/api/viewings/:id/accept` | Admin | Accept request |
| POST | `/api/viewings/:id/reject` | Admin | Reject request |

Create JSON:

```json
{
  "property_id": "00000000-0000-0000-0000-000000000000",
  "preferred_date": "2026-11-10T15:00:00.000Z",
  "email": "client@example.com",
  "booking_notes": "Please show the rooftop access"
}
```

`property_id` may identify either a property or an apartment unit (not an apartment parent). The date must be a future ISO timestamp. The response includes `listing_type` (`property` or `apartment_unit`) and the created row in `data`. Admin list rows include listing title/address/type and the unit name where applicable. The list defaults to page 1 with 10 rows and returns pagination metadata. The legacy `offset` query parameter remains accepted; prefer `page` for page-based next/previous navigation. The validation error for create may use `{ "error": "..." }` rather than the standard status/message envelope.

The current viewing schema migration is [migrations/20261006_add_apartment_viewings.sql](migrations/20261006_add_apartment_viewings.sql); apply it before deploying apartment-unit viewing support to a database that has not been migrated.

## Idempotent writes

The following routes require a unique `Idempotency-Key` header (printable ASCII, 1-200 characters):

- `POST /api/properties`
- `POST /api/apartments`
- `POST /api/shortlets`
- `POST /api/shortlets/:id/units`
- `POST /api/bookings`
- `POST /api/payments/initialize`
- `POST /api/viewings`
- `POST /api/admin/tenants`
- `POST /api/admin/assign-tenant/:id`
- `POST /api/tenants/assign/:apartmentUnitId`
- `POST /api/tenancies`

Use a fresh key for each new user action and reuse that same key only when retrying that exact request. A completed retry replays the original status/body and sets `Idempotency-Replayed: true`. Reusing a key with a different payload returns 422; an in-progress duplicate returns 409. Keys expire after 24 hours. The service depends on Redis; it returns 503 when the idempotency service is unavailable. Do not attach this header requirement to other routes unless they are added to the list above.

```js
await apiRequest('/bookings', {
  method: 'POST',
  headers: { 'Idempotency-Key': crypto.randomUUID() },
  body: JSON.stringify({
    shortlet_unit_id: unitId,
    first_name: 'Jane',
    last_name: 'Doe',
    checkIn: '2026-11-01T15:00:00.000Z',
    checkOut: '2026-11-05T11:00:00.000Z',
    amount: 120000,
  }),
});
```

## Frontend workflow examples

Login, then check the session and role before showing admin screens:

```js
await apiRequest('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

const session = await apiRequest('/auth/me');
if (session.data.role !== 'admin') {
  throw new Error('An admin account is required');
}
```

Load admin tables using the endpoint's own pagination convention: bookings/stays use `page` and `limit`; tenants/viewings use `limit` and `offset`; tenancies are currently unpaginated.

To create a property with photos, submit `FormData` and let the browser set the content type:

```js
const form = new FormData();
form.append('title', 'Luxury Villa');
form.append('city', 'Lagos');
form.append('state', 'Lagos');
form.append('address', '12 Lekki Phase 1');
form.append('description', 'Four-bedroom villa with pool');
form.append('type', 'villa');
form.append('price', '2500000');
form.append('highlighted', 'yes');
form.append('beds', '4');
form.append('baths', '3');
form.append('features', JSON.stringify(['Pool', 'Parking', 'Garden']));
for (const file of selectedFiles) form.append('image', file);

await apiRequest('/properties', {
  method: 'POST',
  headers: { 'Idempotency-Key': crypto.randomUUID() },
  body: form,
});
```

Use `highlighted` as the string expected by the existing property schema, and confirm which accepted enum value your deployment uses. `schema.dbml` defines `yes`/`no`.

## Route gaps and implementation notes

- The stays API is read-only. Confirm/reject stays through the booking accept/reject actions; there is no direct status endpoint.
- The admin tenant assignment alias has a known unit-reference issue; use `/api/tenants/assign/:apartmentUnitId`.
- A few APIs are legacy/inconsistent: tenant create routes use different validation and response formats; some validation errors are not in the common envelope. Frontend error handling should use both HTTP status and a tolerant message fallback.
- Property, apartment, and shortlet image uploads are stored through Supabase Storage. Never send the service-role key to the browser.

## Health check and project layout

```bash
curl http://localhost:2000/health
```

Expected response: `{ "status": "ok", "timestamp": "..." }`.

```text
Controllers/  Request handlers and validation
Models/       PostgreSQL queries and data access
Routers/      Express route definitions
Services/     Logging, email, and idempotency
Utils/        Upload and business-rule helpers
migrations/   SQL migrations
app.js        Express application and middleware
server.js     Database check and HTTP server startup
schema.dbml   Database relationship and enum reference
```

## Security

- Restrict `CORS_ORIGIN` to the deployed frontend origin and use HTTPS in production.
- Keep database, Redis, Supabase service-role, session, and email secrets on the server only.
- Use `credentials: 'include'` only with the intended API origin.
- Treat client-side role checks as UI behavior only; the API's `adminProtect` middleware remains authoritative.

## License

ISC