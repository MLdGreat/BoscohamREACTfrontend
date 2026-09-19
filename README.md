# Boscoham Properties Platform

A Node.js property management backend for managing property listings, apartments, shortlets, users, and viewing schedules. The app uses Express for the HTTP API, PostgreSQL for persistent data storage, Redis for sessions, Supabase for file uploads, and Resend for email notifications.

## Overview

This platform supports:

- User signup and login with session-based authentication
- Password reset flow via email
- Property creation, updates, and deletion
- Apartment and unit management
- Shortlet and shortlet-unit management
- Viewing request creation and admin approval/rejection
- Admin-only management endpoints
- Image uploads to Supabase storage

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Redis
- Supabase Storage
- Resend Email Service
- Joi validation
- bcrypt password hashing
- Multer for multipart uploads
- EJS for server-rendered views if needed for auth flows

## Project Structure

```text
.
├── app.js
├── server.js
├── db.js
├── redis.js
├── supabase.js
├── config.env
├── Controllers/
├── Models/
├── Routers/
├── Services/
├── upload/
└── README.md
```

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL database
- Redis instance
- Supabase project with a storage bucket named `upload`
- Email provider credentials for Resend

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `config.env` file in the project root using the values from your environment.

## Required Environment Variables

```env
DATABASE_CONNECTION_STRING=postgresql://...
SESSION_SECRET_KEY=your_session_secret
RESEND_API_KEY=your_resend_key
BUSINESS_NAME=BOSCOHAMPROPERTIES
REDIS_PASSWORD=your_redis_password
REDIS_USERNAME=default
REDIS_HOST=your_redis_host
REDIS_PORT=6379
RESEND_EMAIL_DOMAIN=boscoham.homes
EMAIL_FROM="Boscoham <noreply@boscoham.homes>"
PRODUCTION_API_DOMAIN=https://your-domain.com/
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## Run the App

Start the API:

```bash
npm start
```

Run with auto-restart during development:

```bash
npm run dev
```

The app listens on port `2000` by default.

## Base URL

```text
http://localhost:2000
```

## Authentication Routes

### Sign up

```http
POST /api/auth/signup
```

Request body:

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "password": "StrongPass1@",
  "confirmPassword": "StrongPass1@"
}
```

### Login

```http
POST /api/auth/login
```

```json
{
  "email": "jane@example.com",
  "password": "StrongPass1@"
}
```

### Current user

```http
GET /api/auth/me
```

### Logout

```http
POST /api/auth/logout
```

### Forgot password

```http
POST /api/auth/forgot-password
```

```json
{
  "email": "jane@example.com"
}
```

### Reset password

```http
POST /api/auth/reset-password/:token
```

## Property Routes

### Get all properties

```http
GET /api/properties
```

### Create a property

```http
POST /api/properties
```

Requires admin authentication. Supports multipart file upload with `image` or multiple files.

### Update a property

```http
PATCH /api/properties/:id
```

### Delete a property

```http
DELETE /api/properties/:id
```

## Apartment Routes

### Get all apartments

```http
GET /api/apartments
```

### Create an apartment

```http
POST /api/apartments
```

### Update apartment

```http
PATCH /api/apartments/:id
```

### Delete apartment

```http
DELETE /api/apartments/:id
```

### Update apartment unit

```http
PATCH /api/apartments/:id/units/:unitId
```

### Delete apartment unit

```http
DELETE /api/apartments/:id/units/:unitId
```

## Shortlet Routes

### Get all shortlets

```http
GET /api/shortlets
```

### Get one shortlet

```http
GET /api/shortlets/:id
```

### Create shortlet

```http
POST /api/shortlets
```

### Create shortlet unit

```http
POST /api/shortlets/:id/units
```

### Update shortlet unit

```http
PATCH /api/shortlets/:id/units/:unitId
```

### Delete shortlet unit

```http
DELETE /api/shortlets/:id/units/:unitId
```

## Viewing Routes

### Create a viewing

```http
POST /api/viewings
```

## Admin Routes

### Get all tenants

```http
GET /api/admin/tenants
```

### Create tenant

```http
POST /api/admin/tenants
```

### Update tenant

```http
PATCH /api/admin/tenants/:id
```

### Delete tenant

```http
DELETE /api/admin/tenants/:id
```

### Assign tenant to apartment

```http
POST /api/admin/assign-tenant/:id
```

### Get all viewings

```http
GET /api/admin/viewings
```

### Accept viewing

```http
POST /api/admin/viewings/accept/:id
```

### Reject viewing

```http
POST /api/admin/viewings/reject/:id
```

## Response Convention

Most endpoints return JSON in this format:

```json
{
  "status": "success",
  "data": {}
}
```

Error responses follow this pattern:

```json
{
  "status": "fail",
  "message": "Description of the error"
}
```

## Notes

- Protected admin routes require an authenticated admin session.
- Redis is used for Express session storage and temporary auth-related values.
- Supabase storage handles uploaded property and apartment images.
- The server connects to PostgreSQL on startup and fails fast if the database is unavailable.

## License

This project is licensed under the ISC license.

  ]
}
```

## 2) Create a property

- Method: POST
- Route: /api/properties
- Auth: Admin required
- Content-Type: multipart/form-data

### Required fields

- title: string
- city: string
- state: string
- address: string
- type: string
- price: number
- description: string
- highlighted: string
- image: one or more image files

### Example form-data

```text
title: Sunset Villa
city: Lagos
state: Lagos
address: 12 Lekki Phase 1
type: villa
price: 2500000
description: Luxury home with pool
highlighted: yes
image: <file1>
image: <file2>
```

### Response example

```json
{
  "status": "success",
  "message": "Property Created Successfully"
}
```

## 3) Update a property

- Method: PATCH
- Route: /api/properties/:id
- Auth: Admin required
- Content-Type: multipart/form-data

### Notes

- Any of the property field values may be sent for update.
- Image files may also be sent for replacement.

### Example payload

```json
{
  "title": "Updated Title",
  "price": 2700000,
  "description": "Updated description"
}
```

### Response example

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Updated Title"
  }
}
```

## 4) Delete a property

- Method: DELETE
- Route: /api/properties/:id
- Auth: Admin required

### Response example

```json
{
  "status": "success",
  "message": "Property Deleted Successfully"
}
```

---

# Apartments

## 1) Get all apartments

- Method: GET
- Route: /api/apartments
- Auth: Public

### Response example

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "title": "Lakeview Apartment",
      "description": "Modern apartment block",
      "city": "Abuja",
      "state": "FCT",
      "address": "2 Maitama Street",
      "images": [
        { "id": "uuid", "image_url": "https://..." }
      ],
      "units": [
        {
          "id": "uuid",
          "price": 230000,
          "bedroom": 2,
          "bathroom": 2,
          "availability": "available",
          "images": [
            { "id": "uuid", "image_url": "https://..." }
          ]
        }
      ]
    }
  ]
}
```

## 2) Create an apartment

- Method: POST
- Route: /api/apartments
- Auth: Admin required
- Content-Type: multipart/form-data

### Required fields

- title: string
- description: string
- city: string
- state: string
- address: string
- units: JSON string array, for example:

```json
[
  {
    "clientUnitId": "uuid",
    "imageField": "unitImages[uuid]",
    "unitNumber": "A1",
    "bedrooms": 2,
    "bathrooms": 2,
    "price": 250000
  }
]
```

- image: apartment-level images
- unitImages[clientUnitId]: unit images keyed by the matching clientUnitId

### Response example

```json
{
  "status": "success",
  "message": "Apartment created successfully",
  "data": {
    "apartment": {
      "id": "uuid"
    }
  }
}
```

## 3) Update an apartment

- Method: PATCH
- Route: /api/apartments/:id
- Auth: Admin required
- Content-Type: multipart/form-data

### Allowed updates

- title
- description
- city
- state
- address
- apartment-level images

### Example payload

```json
{
  "title": "Updated Apartment Name",
  "city": "Kaduna"
}
```

### Response example

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Updated Apartment Name"
  }
}
```

## 4) Delete an apartment

- Method: DELETE
- Route: /api/apartments/:id
- Auth: Admin required

### Response example

```json
{
  "status": "success",
  "message": "Apartment deleted successfully"
}
```

## 5) Update an apartment unit

- Method: PATCH
- Route: /api/apartments/:id/units/:unitId
- Auth: Admin required
- Content-Type: multipart/form-data

### Allowed updates

- unit_name
- price
- bedroom
- bathroom
- availability
- unit images

### Example payload

```json
{
  "price": 260000,
  "bedroom": 3,
  "bathroom": 2,
  "availability": "available"
}
```

### Response example

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "price": 260000
  }
}
```

## 6) Delete an apartment unit

- Method: DELETE
- Route: /api/apartments/:id/units/:unitId
- Auth: Admin required

### Response example

```json
{
  "status": "success",
  "message": "Apartment unit deleted successfully"
}
```

---

# Shortlets

## 1) Get all shortlets

- Method: GET
- Route: /api/shortlets
- Auth: Public

### Response example

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "city": "Ibadan",
      "state": "Oyo",
      "address": "14 Ring Road",
      "images": [
        { "id": "uuid", "image_url": "https://..." }
      ],
      "units": [
        {
          "id": "uuid",
          "price_per_night": 25000,
          "bedroom": 1,
          "bathroom": 1,
          "availability": "available",
          "images": [
            { "id": "uuid", "image_url": "https://..." }
          ]
        }
      ]
    }
  ]
}
```

## 2) Get one shortlet

- Method: GET
- Route: /api/shortlets/:id
- Auth: Public

### Response example

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "city": "Ibadan",
    "state": "Oyo",
    "address": "14 Ring Road"
  }
}
```

## 3) Create a shortlet

- Method: POST
- Route: /api/shortlets
- Auth: Admin required
- Content-Type: multipart/form-data

### Required fields

- city: string
- state: string
- address: string
- units: JSON string array, for example:

```json
[
  {
    "clientUnitId": "uuid",
    "imageField": "unitImages[uuid]",
    "price": 25000,
    "bedrooms": 1,
    "bathrooms": 1,
    "availability": "available"
  }
]
```

- image: shortlet-level images
- unitImages[clientUnitId]: unit images keyed by the matching clientUnitId

### Response example

```json
{
  "status": "success",
  "message": "Shortlet created successfully",
  "data": {
    "shortlet": {
      "id": "uuid"
    }
  }
}
```

## 4) Update a shortlet

- Method: PATCH
- Route: /api/shortlets/:id
- Auth: Admin required

### Allowed updates

- city
- state
- address

### Response example

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "city": "Ibadan"
  }
}
```

## 5) Delete a shortlet

- Method: DELETE
- Route: /api/shortlets/:id
- Auth: Admin required

### Response example

```json
{
  "status": "success",
  "message": "Shortlet deleted successfully"
}
```

## 6) Get a shortlet’s units

- Method: GET
- Route: /api/shortlets/:id/units
- Auth: Public

### Response example

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "price_per_night": 25000,
      "bedroom": 1,
      "bathroom": 1,
      "availability": "available"
    }
  ]
}
```

## 7) Create a shortlet unit

- Method: POST
- Route: /api/shortlets/:id/units
- Auth: Admin required

### Example payload

```json
{
  "price_per_night": 30000,
  "bedroom": 2,
  "bathroom": 2,
  "availability": "available"
}
```

### Response example

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "price_per_night": 30000
  }
}
```

## 8) Update a shortlet unit

- Method: PATCH
- Route: /api/shortlets/:id/units/:unitId
- Auth: Admin required

### Allowed updates

- price_per_night
- bedroom
- bathroom
- availability

### Response example

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "price_per_night": 32000
  }
}
```

## 9) Delete a shortlet unit

- Method: DELETE
- Route: /api/shortlets/:id/units/:unitId
- Auth: Admin required

### Response example

```json
{
  "status": "success",
  "message": "Unit deleted successfully"
}
```

---

# Notes

- Property uploads use a multipart field called image.
- Apartment and shortlet creation support both parent-level and per-unit images.
- Parent-level images are stored under folders such as property-images/<id>, apartment-images/<id>, or shortlet-images/<id>.
- Unit images are stored under folders such as unit-images/<apartmentId>/<unitId> or shortlet-unit-images/<shortletId>/<unitId>.
- Validation is strict and failed input typically returns HTTP 400 with a detailed validation message.
