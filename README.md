# AutoVerse API + Frontend (Monolith)

AutoVerse is a simple virtual car dealership app:
- Node.js/Express backend (REST API)
- MongoDB (Mongoose)
- Static frontend served from the same Express server (`/frontend`)
- JWT authentication (USER / ADMIN roles)

The app supports browsing cars, viewing per-car configurations (including a 3D Sketchfab embed via stored embed HTML), a shopping cart, and orders. Admins can manage cars and configurations, and view/update orders.

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT auth (`Authorization: Bearer <token>`)
- Static frontend (plain HTML/CSS/JS in `frontend/`)

## Project Structure

- `server.js` - Express app entrypoint
- `config/db.js` - MongoDB connection
- `models/` - Mongoose models (`User`, `Car`, `Config`, `Cart`, `Order`)
- `controllers/` - Route handlers
- `routes/` - API route definitions
- `middlewares/` - `authMiddleware` (JWT), `roleMiddleware` (JWT + role check)
- `frontend/` - Static pages and JS client

## Environment Variables

Create a `.env` file in the project root:

```bash
MONGO_URI=your_mongodb_connection_string
PORT=3003
JWT_SECRET=your_long_random_secret
APP_URL=http://localhost:3003
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

Notes:
- `JWT_SECRET` is required (the server will throw on startup if missing).
- `EMAIL_USER`/`EMAIL_PASS` are required for email verification and order confirmation codes.
- `APP_URL` is used to generate email verification links.
- On hosting platforms like Render, `PORT` is provided automatically; locally you can set it (example: `3003`).

## Run Locally

Prerequisites:
- Node.js 18+ recommended
- A MongoDB database (local MongoDB or Mongo Atlas)

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

Development (auto-reload):

```bash
npm run dev
```

Open in browser:
- Frontend: `http://localhost:<PORT>/` (redirects to `/frontend/index.html`)
- API base: `http://localhost:<PORT>/api`

### Seed Database (Optional)

This repo includes a seed script that wipes existing data and inserts demo data.

```bash
npm run seed
```

Warning: this deletes all documents in `users`, `cars`, and `configs`.

## Authentication / Current User

### How controllers know the current user

- The client sends a JWT in `Authorization: Bearer <token>`.
- `middlewares/authMiddleware.js` verifies the token and assigns the decoded payload to `req.user`.
- `middlewares/roleMiddleware.js` does the same, and also checks that `req.user.role` is allowed.

Token payload shape (created in `controllers/authController.js`):

```json
{ "id": "<userId>", "role": "USER" }
```

## API Documentation

Base URL: `/api`

### Auth (`/api/auth`)

#### POST `/api/auth/register`
Create a new user and send an email verification link.

Request body:
```json
{ "email": "user@example.com", "password": "secret123" }
```

Response `201`:
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": { "id": "<id>", "email": "user@example.com", "role": "USER", "isVerified": false }
}
```

Common errors:
- `400` validation errors (invalid email, password length, or existing user)

#### POST `/api/auth/login`
Login and receive a JWT.

Request body:
```json
{ "email": "user@example.com", "password": "secret123" }
```

Response `200`:
```json
{
  "token": "<jwt>",
  "user": { "id": "<id>", "email": "user@example.com", "role": "USER" }
}
```

Common errors:
- `403` if email is not verified yet

#### GET `/api/auth/me`
Get the currently logged-in user.

Headers:
```http
Authorization: Bearer <jwt>
```

Response `200`:
```json
{ "_id": "<id>", "email": "user@example.com", "role": "USER", "createdAt": "...", "updatedAt": "..." }
```

#### GET `/api/auth/users` (Admin only)
Get all users (password excluded).

Headers:
```http
Authorization: Bearer <admin-jwt>
```

#### GET `/api/auth/verify-email?token=...`
Verify email by token from the email link.

#### POST `/api/auth/resend-verification`
Resend verification email.

Request body:
```json
{ "email": "user@example.com" }
```

#### DELETE `/api/auth/users/:id` (Admin only)
Permanently delete a user account.

### Cars (`/api/cars`)

#### GET `/api/cars`
List all available cars.

Response `200`:
```json
[
  {
    "_id": "<carId>",
    "brand": "Tesla",
    "model": "Cybertruck",
    "year": 2024,
    "basePrice": 39990,
    "heroImage": "https://...",
    "available": true
  }
]
```

#### GET `/api/cars/:id`
Get one car by id.

#### GET `/api/cars/:id/configs`
Get configurations for a car (sorted by `priceTotal`).

Response `200`:
```json
[
  {
    "_id": "<configId>",
    "carId": "<carId>",
    "name": "Base",
    "priceTotal": 39990,
    "sketchfabEmbedHtml": "<iframe ...></iframe>",
    "specs": { "engine": "Standard", "color": "Pearl White", "interior": "Black Fabric" }
  }
]
```

#### POST `/api/cars` (Admin only)
Create a car.

Headers:
```http
Authorization: Bearer <admin-jwt>
```

Request body:
```json
{
  "brand": "BMW",
  "model": "M4",
  "year": 2024,
  "basePrice": 74900,
  "heroImage": "https://...",
  "available": true
}
```

#### PUT `/api/cars/:id` (Admin only)
Update a car (partial updates allowed).

#### DELETE `/api/cars/:id` (Admin only)
Delete a car and all related configurations.

### Configurations (`/api/configs`) (Admin only)

All `/api/configs` routes require an ADMIN JWT (`roleMiddleware(['ADMIN'])`).

Headers:
```http
Authorization: Bearer <admin-jwt>
```

#### GET `/api/configs`
List all configurations (populates `carId` with `brand` and `model`).

#### GET `/api/configs/:id`
Get one configuration by id.

#### POST `/api/configs`
Create a configuration for a car.

Request body:
```json
{
  "carId": "<carId>",
  "name": "Base",
  "priceTotal": 39990,
  "sketchfabEmbedHtml": "<iframe src=\"https://sketchfab.com/models/.../embed\" frameborder=\"0\" allowfullscreen></iframe>",
  "specs": { "engine": "Standard", "color": "Gray", "interior": "Black" }
}
```

Notes:
- A car can have max 3 configurations (enforced in `createConfig`).

#### PUT `/api/configs/:id`
Update a configuration.

#### DELETE `/api/configs/:id`
Delete a configuration.

### Cart (`/api/cart`) (Authenticated)

All cart routes require a valid JWT (`authMiddleware`).

Headers:
```http
Authorization: Bearer <jwt>
```

#### GET `/api/cart`
Get the current user's cart.

#### POST `/api/cart`
Add an item to cart.

Request body:
```json
{ "carId": "<carId>", "configurationId": "<configId>" }
```

#### DELETE `/api/cart/item/:itemIndex`
Remove an item by array index (0-based).

#### DELETE `/api/cart`
Clear the cart.

### Orders (`/api/orders`)

#### GET `/api/orders` (Authenticated)
List orders for the current user.

Headers:
```http
Authorization: Bearer <jwt>
```

#### GET `/api/orders/:id` (Authenticated)
Get an order by id.

Rules:
- Allowed if the order belongs to the current user, or the user is ADMIN.

#### POST `/api/orders` (Authenticated)
Deprecated for checkout flow. Returns a message explaining to use confirmation-code endpoints.

#### POST `/api/orders/checkout/request-code` (Authenticated)
Send a one-time 6-digit confirmation code to the user's email.

#### POST `/api/orders/checkout/confirm` (Authenticated)
Confirm order with email code and create order from cart.

Request body:
```json
{ "code": "123456" }
```

#### GET `/api/orders/admin/all` (Admin only)
List all orders (ADMIN).

#### GET `/api/orders/admin/sales` (Admin only)
Daily sales analytics.

Optional query params:
- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`

If not provided, defaults to last 7 days.

#### PUT `/api/orders/:id/status` (Admin only)
Update order status.

Request body:
```json
{ "status": "confirmed" }
```

Valid statuses:
- `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`

## Notes for Deployment (Render / “all-in-one”)

- Deploy as a single Node.js Web Service.
- Set Render environment variables:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `APP_URL`
  - `EMAIL_USER`
  - `EMAIL_PASS`
- `PORT` is provided by Render automatically.
- The frontend is served from the same service under `/frontend`.
