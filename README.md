# Boscoham Properties Platform

Boscoham Properties Platform is a property-management API for listings, apartments, shortlets, bookings, tenancies, tenants, and viewing requests.

This project is designed to be used by a frontend app that speaks JSON for app data and uses browser cookies for authenticated sessions. The server is built with Express, PostgreSQL, Redis, Supabase Storage, and Resend.

## Product overview

- Public catalog for properties, apartments, and shortlets
- Admin-only management for listings, units, tenants, bookings, and stays
- Session-based auth for the frontend app
- Image uploads for listing and unit photos
- Booking and tenancy overlap checks to prevent double-booking

## Stack

- Node.js
- Express
- PostgreSQL
- Redis
- Supabase Storage
- Resend
- Joi, bcrypt, multer, helmet, cors

## Local setup

Install dependencies:

```bash
npm install
```

Create a local `config.env` file in the project root. Do not commit real credentials.

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
```

Start the API:

```bash
npm start
```

Development mode:

```bash
npm run dev
```

Base URL:

```text
http://localhost:2000
```

## Frontend integration notes

This backend is written for browser-based apps and uses cookies for authentication.

When calling the API from the frontend, always do this:

```js
fetch('http://localhost:2000/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'jane@example.com',
    password: 'StrongPass1@',
  }),
});
```

Important rules:

- Use `credentials: 'include'` for all authenticated requests.
- The browser will store the session cookie automatically.
- For uploads, use `FormData` instead of JSON.
- For admin-only actions, the user must be logged in as an admin.

## Response format

The API generally responds with a JSON envelope like this:

```json
{
  "status": "success",
  "data": { ... }
}
```

Error responses usually look like:

```json
{
  "status": "fail",
  "message": "Validation failed"
}
```

Or:

```json
{
  "status": "error",
  "message": "Internal Server Error"
}
```

Common HTTP status codes:

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 500 Internal Server Error

## Authentication

### Public auth routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create a new account |
| POST | `/api/auth/login` | Log in and create a session |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get the currently logged-in user |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password/:token` | Reset password with token |

Example signup payload:

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "password": "StrongPass1@",
  "confirmPassword": "StrongPass1@"
}
```

Example login payload:

```json
{
  "email": "jane@example.com",
  "password": "StrongPass1@"
}
```

## Public catalog endpoints

### Properties

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/properties` | Public |
| POST | `/api/properties` | Admin |
| PATCH | `/api/properties/:id` | Admin |
| DELETE | `/api/properties/:id` | Admin |

Property create/update uses `multipart/form-data`.

Example field names for property creation:

```text
title
city
state
address
description
type
price
highlighted
beds
baths
features
image
```

`features` should be a JSON array string, for example:

```json
["Swimming pool", "Garage"]
```

You can attach multiple files using the `image` field. The server accepts JPG, PNG, and WEBP images with a 5 MB cap per file.

### Apartments

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/apartments` | Public |
| POST | `/api/apartments` | Admin |
| PATCH | `/api/apartments/:id` | Admin |
| DELETE | `/api/apartments/:id` | Admin |
| PATCH | `/api/apartments/:id/units/:unitId` | Admin |
| DELETE | `/api/apartments/:id/units/:unitId` | Admin |

Apartment creation is a `multipart/form-data` flow. The main form fields are:

```text
title
description
city
state
address
features
units
image
unitImages[uuid]
```

The `units` value is a JSON string representing an array of unit objects like:

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

### Shortlets

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/shortlets` | Public |
| POST | `/api/shortlets` | Admin |
| GET | `/api/shortlets/:id` | Public |
| PATCH | `/api/shortlets/:id` | Admin |
| DELETE | `/api/shortlets/:id` | Admin |
| GET | `/api/shortlets/:id/units` | Public |
| POST | `/api/shortlets/:id/units` | Admin |
| PATCH | `/api/shortlets/:id/units/:unitId` | Admin |
| DELETE | `/api/shortlets/:id/units/:unitId` | Admin |

Shortlet creation also uses `multipart/form-data` and expects a JSON `units` string with objects like:

```json
[
  {
    "clientUnitId": "f5b867d0-b668-4cc3-aaa5-c12bc7bcfca0",
    "imageField": "unitImages[f5b867d0-b668-4cc3-aaa5-c12bc7bcfca0]",
    "title": "Deluxe Studio",
    "price": 180000,
    "bedrooms": 1,
    "bathrooms": 1,
    "availability": "available"
  }
]
```

## Booking and tenancy flows

### Bookings

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/bookings` | Session |
| GET | `/api/bookings` | Admin |
| PATCH | `/api/bookings/accept/:id` | Admin |
| PATCH | `/api/bookings/reject/:id` | Admin |

Example payload:

```json
{
  "shortlet_unit_id": "00000000-0000-0000-0000-000000000000",
  "user_id": "00000000-0000-0000-0000-000000000000",
  "first_name": "Jane",
  "last_name": "Doe",
  "notes": "Late arrival",
  "check_in": "2026-10-01",
  "check_out": "2026-10-05",
  "amount": 120000
}
```

The server prevents overlapping bookings for the same shortlet unit when the booking is pending or confirmed.

### Tenancies

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/tenancies` | Admin |
| POST | `/api/tenancies` | Admin |
| GET | `/api/tenancies/:id` | Admin |
| PATCH | `/api/tenancies/:id` | Admin |
| DELETE | `/api/tenancies/:id` | Admin |

Example payload:

```json
{
  "apartment_id": "00000000-0000-0000-0000-000000000000",
  "apartment_unit_id": "00000000-0000-0000-0000-000000000000",
  "tenant_id": "00000000-0000-0000-0000-000000000000",
  "move_in": "2026-10-01",
  "move_out": "2026-12-31"
}
```

### Viewings

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/viewings` | Session |
| GET | `/api/viewings` | Admin |
| POST | `/api/viewings/:id/accept` | Admin |
| POST | `/api/viewings/:id/reject` | Admin |

Example payload:

```json
{
  "property_id": "00000000-0000-0000-0000-000000000000",
  "preferred_date": "2026-10-10T15:00:00.000Z",
  "email": "client@example.com",
  "booking_notes": "Please show the rooftop access"
}
```

## Idempotency

The API supports idempotency for duplicate-prone writes. Include a unique `Idempotency-Key` header on requests like:

- `POST /api/properties`
- `POST /api/apartments`
- `POST /api/shortlets`
- `POST /api/shortlets/:id/units`
- `POST /api/bookings`
- `POST /api/viewings`
- `POST /api/tenancies`

Example:

```http
POST /api/bookings
Idempotency-Key: 8c2f87f6-2940-4fd8-af64-8a1f231d351c
Content-Type: application/json
```

Retrying the same request with the same key will return the original result, while a different payload for the same key is rejected.

## Quick frontend examples

### Fetch current user

```js
const res = await fetch('http://localhost:2000/api/auth/me', {
  credentials: 'include',
});
const data = await res.json();
console.log(data);
```

### Upload a property

```js
const form = new FormData();
form.append('title', 'Luxury Villa');
form.append('city', 'Lagos');
form.append('state', 'Lagos');
form.append('address', '12 Lekki Phase 1');
form.append('description', '4-bedroom villa with pool');
form.append('type', 'villa');
form.append('price', '2500000');
form.append('highlighted', 'true');
form.append('beds', '4');
form.append('baths', '3');
form.append('features', JSON.stringify(['Pool', 'Parking', 'Garden']));
form.append('image', fileInput.files[0]);

const res = await fetch('http://localhost:2000/api/properties', {
  method: 'POST',
  credentials: 'include',
  body: form,
});
```

### Create a booking

```js
const res = await fetch('http://localhost:2000/api/bookings', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    shortlet_unit_id: '00000000-0000-0000-0000-000000000000',
    first_name: 'Jane',
    last_name: 'Doe',
    notes: 'Late arrival',
    check_in: '2026-10-01',
    check_out: '2026-10-05',
    amount: 120000,
  }),
});
```

## Notes for frontend teams

- Most listing data is returned under `data`.
- Auth is session-based, so browser cookies must be enabled.
- For image-heavy flows, use `FormData`.
- For sensitive or admin-only operations, verify the user has the admin role before showing the UI.
- Use 409 responses as a signal to show conflict messaging, such as overlap warnings or already-booked units.

## Security notes

- Keep `config.env` outside the repository.
- Use a production-grade reverse proxy and HTTPS in production.
- Keep the CORS origin restricted to the actual frontend domain.
- Do not expose the Supabase service-role key or the database connection string to the frontend.

## Useful health check

```bash
curl http://localhost:2000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-10-06T00:00:00.000Z"
}
```

```json
{
  "tenantId": "00000000-0000-0000-0000-000000000000",
  "apartmentId": "00000000-0000-0000-0000-000000000000",
  "move_in": "2026-10-01T00:00:00.000Z",
  "move_out": "2027-09-30T00:00:00.000Z"
}
```

The API rejects conflicting tenancy dates with `409 Conflict`.

`GET /api/tenancies` returns the apartment title, apartment-unit title, tenant name and email, and tenancy move-in and move-out dates. Results are ordered by newest tenancy first. `GET /api/tenancies/:id` returns the stored tenancy record.

Create a tenancy with `POST /api/tenancies`, or update one with `PATCH /api/tenancies/:id`. Both endpoints accept JSON fields `apartment_id`, `apartment_unit_id`, `tenant_id`, `move_in`, and `move_out`; all fields are required for create and optional for update. The unit must belong to the selected apartment, `move_out` must be after `move_in`, and date conflicts for the same unit return `409 Conflict`. Delete a tenancy with `DELETE /api/tenancies/:id`.

## Responses and errors

Successful requests generally return JSON in this shape:

```json
{
  "status": "success",
  "data": {}
}
```

Validation and application errors generally include a `status` and `message`. The API also returns an `x-request-id` header, which is useful when tracing a request in server logs.

## Project layout

```text
Controllers/  Request handlers and validation
Models/       PostgreSQL queries and data access
Routers/      Express route definitions
Services/     Logging and email services
upload/       Local upload-related assets
app.js        Express application and middleware
server.js     Database check and HTTP server startup
```

## License

ISC
