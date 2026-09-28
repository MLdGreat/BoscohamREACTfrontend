# Boscoham Properties Platform

Boscoham Properties Platform is an Express API for managing property listings, apartments and long-term tenancies, shortlets and bookings, tenant records, and property-viewing requests.

It uses PostgreSQL for application data, Redis-backed Express sessions for authentication, Supabase Storage for images, and Resend for password-reset email.

## Features

- Session-based user signup, login, logout, and password reset
- Public property, apartment, and shortlet catalogues
- Admin-managed property, apartment, shortlet, tenant, booking, stay, and viewing workflows
- Apartment-unit tenancy assignment with overlap checks
- Shortlet booking conflict checks for pending and confirmed bookings
- Supabase image uploads for properties, apartments, and units

## Stack

- Node.js and Express 5
- PostgreSQL (`pg`)
- Redis and `express-session`
- Supabase Storage
- Resend
- Joi, bcrypt, Multer, CORS, and Helmet

## Prerequisites

- Node.js 18 or later
- npm
- PostgreSQL
- Redis
- A Supabase project with an `upload` storage bucket
- A Resend API key and verified sender address

## Setup

Install dependencies:

```bash
npm install
```

Create `config.env` in the project root. Do not commit this file or any real credentials.

```env
DATABASE_CONNECTION_STRING=postgresql://USER:PASSWORD@HOST:5432/DATABASE
SESSION_SECRET_KEY=replace-with-a-long-random-secret
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM="Boscoham <noreply@example.com>"
PRODUCTION_API_DOMAIN=https://api.example.com/
NODE_ENV=development
PORT=2000
# Optional: a single permitted frontend origin.
CORS_ORIGIN=http://localhost:5173
```

Start the server:

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

The default API URL is `http://localhost:2000`.

## Authentication

Authentication is cookie/session based. Send requests with credentials enabled from a browser client (for example, `credentials: 'include'` with `fetch`). A logged-in session lasts 30 minutes. Admin routes require a session belonging to an admin user.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | Create a user account |
| POST | `/api/auth/login` | Public | Start a session |
| POST | `/api/auth/logout` | Session | End the current session |
| GET | `/api/auth/me` | Public | Return the authenticated user, if present |
| POST | `/api/auth/forgot-password` | Public | Send a password-reset email |
| POST | `/api/auth/reset-password/:token` | Public | Set a new password using a reset token |

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

## API routes

`UUID` path parameters below must be valid UUIDs.

### Properties

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/properties` | Public |
| POST | `/api/properties` | Admin |
| PATCH | `/api/properties/:id` | Admin |
| DELETE | `/api/properties/:id` | Admin |

Property create and update requests use `multipart/form-data`. Create requires `title`, `city`, `state`, `address`, `type`, `price`, `description`, and `highlighted`; attach up to 10 JPG, PNG, or WEBP files using the `image` field. `beds` and `baths` are optional whole-number fields from `0` to `32767` (for example, `beds: 3` and `baths: 2`). Send either field in a PATCH request to change only that value. They are returned as `beds` and `baths` by `GET /api/properties`; older listings without values return `null`. Properties, apartments, and shortlets support optional `features`: send a JSON array such as `["Swimming pool", "Tennis court"]`; send `null` in an update to clear it.

Example property form fields:

```text
title: Sunset Villa
city: Lagos
state: Lagos
address: 12 Lekki Phase 1
type: villa
price: 2500000
description: Luxury home with pool
highlighted: yes
beds: 4
baths: 3
```

`GET /api/properties` includes the property details required for listing cards, including `beds`, `baths`, and `images`:

```json
{
  "status": "success",
  "data": [{
    "id": "00000000-0000-0000-0000-000000000000",
    "title": "Sunset Villa",
    "beds": 4,
    "baths": 3,
    "images": [{ "image": "https://example.com/property.jpg" }]
  }]
}
```

### Apartments and apartment units

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/apartments` | Public |
| POST | `/api/apartments` | Admin |
| PATCH | `/api/apartments/:id` | Admin |
| DELETE | `/api/apartments/:id` | Admin |
| PATCH | `/api/apartments/:id/units/:unitId` | Admin |
| DELETE | `/api/apartments/:id/units/:unitId` | Admin |

Create an apartment with `multipart/form-data`: parent details (`title`, `description`, `city`, `state`, and `address`), optional `features` JSON, a stringified `units` JSON array, optional `image` files, and optional `unitImages[clientUnitId]` files. Each unit also includes an `imageField` value matching its upload field.

```json
[
  {
    "clientUnitId": "unit-1",
    "imageField": "unitImages[unit-1]",
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

Shortlet creation uses `multipart/form-data` and requires `title`, `city`, `state`, `address`, and a stringified `units` array. It also accepts optional `features` JSON. Each initial unit needs a UUID `clientUnitId`, `imageField`, `title`, `price`, `bedrooms`, `bathrooms`, and `availability`; use `image` for shortlet images and `unitImages[clientUnitId]` for unit images. Creating a unit later uses JSON with `title`, `price_per_night`, `bedroom`, `bathroom`, and `availability`. A unit title may also be changed with `PATCH /api/shortlets/:id/units/:unitId`.

### Bookings and stays

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/bookings` | Session |
| GET | `/api/bookings?page=1&limit=20` | Admin |
| PATCH | `/api/bookings/accept/:id` | Admin |
| PATCH | `/api/bookings/reject/:id` | Admin |
| GET | `/api/stays?page=1&limit=20` | Admin |

Booking requests require a shortlet unit, guest details, date range, and amount:

```json
{
  "shortlet_unit_id": "00000000-0000-0000-0000-000000000000",
  "first_name": "Jane",
  "last_name": "Doe",
  "notes": "Late arrival",
  "checkIn": "2026-10-01T14:00:00.000Z",
  "checkOut": "2026-10-05T11:00:00.000Z",
  "amount": 120000
}
```

`checkOut` must follow `checkIn`. Pending booking requests may overlap. A request or acceptance that overlaps an already confirmed booking for the same unit returns `409 Conflict`. Booking and stay lists use `page` (starting at 1) and `limit` (1-100).

### Viewings

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/viewings` | Session |
| GET | `/api/viewings?limit=10&offset=0` | Admin |
| POST | `/api/viewings/:id/accept` | Admin |
| POST | `/api/viewings/:id/reject` | Admin |

Create a viewing with `property_id`, a future ISO `preferred_date`, `email`, and optional `booking_notes`. Viewing lists accept `limit` (1-50) and a non-negative `offset`.

### Tenants and tenancies

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/tenants?limit=10&offset=0` | Admin |
| POST | `/api/tenants` | Admin |
| POST | `/api/tenants/assign/:apartmentUnitId` | Admin |
| GET | `/api/tenancies` | Admin |
| POST | `/api/tenancies` | Admin |
| GET | `/api/tenancies/:id` | Admin |
| PATCH | `/api/tenancies/:id` | Admin |
| DELETE | `/api/tenancies/:id` | Admin |
| GET | `/api/admin/tenants` | Admin |
| POST | `/api/admin/tenants` | Admin |
| PATCH | `/api/admin/tenants/:id` | Admin |
| DELETE | `/api/admin/tenants/:id` | Admin |
| POST | `/api/admin/assign-tenant/:id` | Admin |

To assign a tenant to a particular apartment unit, send this JSON to `/api/tenants/assign/:apartmentUnitId`:

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
