# Code Explanations (Controllers + Frontend API Client)

This document explains the purpose of each major block of code inside:
- Backend controllers in `controllers/`
- Frontend API client in `frontend/js/api.js`

It is written as a "walkthrough" of what each block does rather than a copy of the code.

## Shared Concept: "Current User" (`req.user`)

Many controllers use `req.user.id` / `req.user.role`. This value is not created inside controllers.

- `middlewares/authMiddleware.js`:
  - Reads `Authorization: Bearer <token>` header
  - Verifies JWT using `controllers/KeyJWT.js`
  - Writes decoded payload to `req.user`
- `middlewares/roleMiddleware.js`:
  - Same as `authMiddleware`, plus it checks `req.user.role` is in allowed roles.

JWT payload is created in `controllers/authController.js` with:
```json
{ "id": "<userId>", "role": "USER|ADMIN" }
```

---

## `controllers/KeyJWT.js`

### Secret loading block
- Reads `process.env.JWT_SECRET` into `secret`.
- Throws immediately if missing.
  - This fails fast on server startup so you don't accidentally run with a hard-coded secret.

### Export block
- Exports `{ secret }` so other files can require it.

---

## `controllers/authController.js`

### Imports block
- `User` model: stores users in MongoDB.
- `bcrypt`: hashes and verifies passwords.
- `jsonwebtoken`: signs JWT tokens.
- `express-validator`'s `validationResult`: reads validation errors produced by route validators.
- `secret` from `KeyJWT.js`: used to sign tokens.

### Token helper block: `generateJwtToken(id, role)`
- Builds a token payload `{ id, role }`.
- Signs it with `jwt.sign(payload, secret, { expiresIn: '24h' })`.
- The resulting token is returned to the client and later sent back in the `Authorization` header.

### Controller class block
The controller is a class with methods, then exported as a singleton (`module.exports = new authController()`).

#### `registration(req, res)`
Major blocks:
- **Validation block**
  - Reads validator errors (from `routes/authRoutes.js`).
  - Returns `400` with `{ message, errors }` if invalid.
- **Input parsing block**
  - Reads `{ email, password }` from `req.body`.
  - Normalizes email to lowercase for consistent lookup.
- **Uniqueness check block**
  - `User.findOne({ email })` to prevent duplicate accounts.
  - Returns `400` if user already exists.
- **Password hashing block**
  - `bcrypt.hash(password, 10)` to store a hash, not raw password.
- **User creation block**
  - Creates and saves a new `User`.
  - Note: the code currently sets `role: 'ADMIN'`. That means every new signup becomes admin.
- **Token response block**
  - Generates JWT using the saved user `_id` and role.
  - Returns `201` with `token` and a `user` object.
- **Error handling block**
  - Logs error and returns `500` with `{ message: 'Registration error' }`.

#### `login(req, res)`
Major blocks:
- **Input parsing block**
  - Reads `{ email, password }` from `req.body`.
  - Normalizes email to lowercase.
- **User lookup block**
  - `User.findOne({ email })`.
  - Returns `400` "Invalid email or password" if not found.
- **Password verify block**
  - `bcrypt.compare(password, user.password)`.
  - Returns `400` if invalid.
- **Token response block**
  - Signs token and returns `{ token, user: { id, email, role } }`.
- **Error handling block**
  - Logs error and returns `500` "Login error".

#### `getUsers(req, res)`
Major blocks:
- **Query block**
  - `User.find({}, { password: 0 })` returns all users but excludes password field.
- **Error handling**
  - Returns `500` on error.
Routing note:
- This endpoint is protected by `roleMiddleware(['ADMIN'])` in `routes/authRoutes.js`.

#### `getMe(req, res)`
Major blocks:
- **Current user block**
  - Reads current user id from `req.user.id` (set by `authMiddleware`).
- **Lookup block**
  - `User.findById(req.user.id, { password: 0 })`.
  - Returns `404` if user not found.
- **Error handling**
  - Returns `500` on error.

---

## `controllers/CarController.js`

### Imports block
- `Car` model: car list used in catalog.
- `Config` model: configuration objects for each car.

#### `getCars(req, res)`
Major blocks:
- **Query block**
  - `Car.find({ available: true })` returns only cars marked available.
- **Error handling**
  - Returns `500` on failure.
Routing note:
- Public route (no auth required).

#### `getCarById(req, res)`
Major blocks:
- **Lookup block**
  - `Car.findById(req.params.id)`.
  - Returns `404` if not found.
- **Error handling**
  - Returns `500` on failure.

#### `getCarConfigs(req, res)`
Major blocks:
- **Car existence check**
  - Loads car by `carId` and returns `404` if missing.
  - This avoids returning configs for a deleted/invalid car id.
- **Configs query**
  - `Config.find({ carId }).sort({ priceTotal: 1 })` (cheapest first).
- **Error handling**
  - Returns `500` on failure.

#### `createCar(req, res)` (Admin only via routes)
Major blocks:
- **Input parsing**
  - Reads fields from `req.body`.
- **Create/save**
  - Creates a new `Car` and saves.
  - Default `available` to `true` if not provided.
- **Error handling**
  - Returns `400` for validation-type errors.

#### `updateCar(req, res)` (Admin only via routes)
Major blocks:
- **Update block**
  - `Car.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })`.
  - `runValidators` ensures schema rules still apply.
- **Not found**
  - Returns `404` if car missing.
- **Error handling**
  - Returns `400` on invalid update payload.

#### `deleteCar(req, res)` (Admin only via routes)
Major blocks:
- **Delete car**
  - `Car.findByIdAndDelete(req.params.id)`.
  - Returns `404` if missing.
- **Cascade-like cleanup**
  - Deletes all `Config` documents for that car (`Config.deleteMany({ carId })`).
- **Error handling**
  - Returns `500` on failure.

---

## `controllers/ConfigController.js`

### Imports block
- `Config` model: configuration details per car.
- `Car` model: used to validate that `carId` exists.

Routing note:
- Every route in `routes/configRoutes.js` is protected by `roleMiddleware(['ADMIN'])`.

#### `getConfigs(req, res)`
Major blocks:
- **Query + populate**
  - `Config.find().populate('carId', 'brand model')`
  - `populate` replaces `carId` ObjectId with `{ _id, brand, model }`.
- **Error handling**
  - Returns `500` on failure.

#### `getConfigById(req, res)`
Major blocks:
- **Lookup + populate**
  - `Config.findById(req.params.id).populate('carId')`
  - Populates full car document (not only brand/model).
- **Not found**
  - Returns `404` if missing.
- **Error handling**
  - Returns `500` on failure.

#### `createConfig(req, res)`
Major blocks:
- **Input parsing**
  - Reads `{ carId, name, priceTotal, sketchfabEmbedHtml, specs }` from body.
- **Car exists check**
  - Loads `Car` by `carId`; returns `404` if missing.
- **Max configs rule**
  - `Config.countDocuments({ carId })` and rejects if `>= 3`.
  - Returns `400` if limit exceeded.
- **Create/save**
  - Saves a new `Config`.
  - `sketchfabEmbedHtml` is stored as-is and later injected into the frontend viewer area.
- **Error handling**
  - Returns `400` (validation or bad payload).

#### `updateConfig(req, res)`
Major blocks:
- **Update**
  - `Config.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })`.
- **Not found**
  - Returns `404` if missing.
- **Error handling**
  - Returns `400` on invalid updates.

#### `deleteConfig(req, res)`
Major blocks:
- **Delete**
  - `Config.findByIdAndDelete(id)`.
- **Not found**
  - Returns `404` if missing.
- **Error handling**
  - Returns `500` on failure.

---

## `controllers/CartController.js`

### Imports block
- `Cart` model: 1 cart per user (`userId` is unique).
- `Car` model: used to validate `carId`.
- `Config` model: used to validate `configurationId` and enforce it belongs to `carId`.

Routing note:
- Every cart route in `routes/cartRoutes.js` uses `authMiddleware`, so `req.user` is always expected.

#### `getCart(req, res)`
Major blocks:
- **Lookup + populate**
  - `Cart.findOne({ userId: req.user.id })`
  - Populates `items.carId` and `items.configurationId` for UI.
- **Empty cart fallback**
  - If no cart doc exists, returns a plain object `{ userId, items: [] }` (does not create DB document).
- **Error handling**
  - Returns `500` on failure.

#### `addItemToCart(req, res)`
Major blocks:
- **Input parsing**
  - Reads `{ carId, configurationId }` from body and `userId` from `req.user.id`.
- **Car existence check**
  - `Car.findById(carId)`; returns `404` if missing.
- **Config validity check**
  - `Config.findOne({ _id: configurationId, carId })`
  - Ensures config exists AND belongs to that specific car.
- **Find-or-create cart**
  - Loads `Cart` for user; creates one if missing.
- **Duplicate item check**
  - Searches existing `cart.items` for same `carId` + `configurationId`.
  - Returns `400` if already in cart.
- **Push item**
  - Adds `{ carId, configurationId, price: config.priceTotal }` to `items`.
  - Saves cart.
- **Return populated cart**
  - Reloads with `populate` so frontend gets readable objects.
- **Error handling**
  - Returns `500` on failure.

#### `removeItem(req, res)`
Major blocks:
- **Input parsing**
  - `itemIndex` from URL params.
  - `userId` from `req.user.id`.
- **Cart existence check**
  - Returns `404` if no cart.
- **Index validation**
  - Validates `itemIndex` is within array bounds; returns `400` if invalid.
- **Remove + save**
  - `cart.items.splice(index, 1)` then `cart.save()`.
- **Return populated cart**
  - Reloads populated cart for response.
- **Error handling**
  - Returns `500` on failure.

#### `clearCart(req, res)`
Major blocks:
- **Find cart**
  - Loads cart by `userId`.
- **Clear items**
  - Sets `items = []` and saves.
- **Response**
  - Returns `{ message: 'Cart cleared', items: [] }` even if cart didn't exist.
- **Error handling**
  - Returns `500` on failure.

---

## `controllers/OrderController.js`

### Imports block
- `Order` model: stores checkout results.
- `Cart` model: used to create orders from the current cart.

Routing note:
- User endpoints are protected by `authMiddleware`.
- Admin endpoints are protected by `roleMiddleware(['ADMIN'])`.

#### `getOrders(req, res)`
Major blocks:
- **Query**
  - `Order.find({ userId: req.user.id })` returns only the current user's orders.
- **Populate**
  - Adds car details and minimal config details to each order item.
- **Sort**
  - Newest first (`createdAt: -1`).
- **Error handling**
  - Returns `500` on failure.

#### `getAllOrders(req, res)` (Admin only)
Major blocks:
- **Query**
  - `Order.find()` returns all orders.
- **Populate**
  - Populates user email and basic car/config fields for admin listing.
- **Sort**
  - Newest first.
- **Error handling**
  - Returns `500` on failure.

#### `getOrderById(req, res)`
Major blocks:
- **Lookup + populate**
  - Loads order by id and populates:
    - `userId` (email)
    - `items.carId` (car details)
    - `items.configurationId` (includes `sketchfabEmbedHtml`)
- **Not found**
  - Returns `404` if missing.
- **Authorization check**
  - Allows access if:
    - order belongs to current user (`order.userId._id === req.user.id`), OR
    - current user is admin (`req.user.role === 'ADMIN'`)
  - Returns `403` if not allowed.
- **Error handling**
  - Returns `500` on failure.

#### `createOrder(req, res)`
Major blocks:
- **Load cart**
  - `Cart.findOne({ userId }).populate(...)`.
- **Empty cart validation**
  - Returns `400` if no cart or no items.
- **Total calculation**
  - `reduce` sum of item prices.
- **Order creation**
  - Writes a new `Order` with `items` mapped from cart items.
  - Initial status: `pending`.
- **Clear cart**
  - Empties cart items after order is saved.
- **Return populated order**
  - Reloads order with basic populate for UI.
- **Error handling**
  - Returns `500` on failure.

#### `updateOrderStatus(req, res)` (Admin only)
Major blocks:
- **Status validation**
  - Validates `status` is in allowed list; returns `400` if not.
- **Update**
  - `Order.findByIdAndUpdate(id, { status }, { new: true })`.
- **Not found**
  - Returns `404` if missing.
- **Populate + response**
  - Populates user + car + config name for admin UI.
- **Error handling**
  - Returns `500` on failure.

---

## `frontend/js/api.js`

This file is the frontend "API client" used by pages like `login.html`, `signup.html`, `catalog.html`, `car.html`, `admin.html`, etc.

### API base URL block
- `API_BASE_URL` is determined like this:
  - If the page is served from a real origin (e.g. `http://localhost:3003`), use `window.location.origin + /api`.
  - If the page is opened via `file://` (origin `"null"`), fallback to `http://localhost:3003/api`.

### Auth storage helper block: `Auth`
This object manages login state in `localStorage`:
- `getToken()` / `setToken()` - read/write JWT.
- `removeToken()` - clears token and cached user.
- `setUser(user)` / `getUser()` - caches user object for quick role checks.
  - If no user exists in localStorage, `getUser()` tries to decode JWT payload (Base64 decode of the middle token segment).
- `isLoggedIn()` - token exists.
- `isAdmin()` - decoded user role is `ADMIN`.
- `logout()` - clears storage and redirects to `/frontend/login.html`.

### Request wrapper block: `apiRequest(endpoint, options)`
This function centralizes fetch behavior:
- Builds full URL: `API_BASE_URL + endpoint`.
- Reads JWT token and sets header:
  - Always `Content-Type: application/json`
  - Adds `Authorization: Bearer <token>` if logged in
- Performs `fetch(url, config)`.
- Parses response JSON.
- If `response.ok` is false, throws an `Error` using `data.message` (from backend) or a default message.
- Logs errors to console and rethrows to the caller.

### API modules block
Thin wrappers around `apiRequest` for each backend feature:

#### `AuthAPI`
- `login(email, password)` -> POST `/auth/login`
  - On success stores token + user in localStorage.
- `register(email, password)` -> POST `/auth/register`
  - On success stores token + user.
- `getMe()` -> GET `/auth/me`
- `getUsers()` -> GET `/auth/users` (admin only)

#### `CarsAPI`
- `getAll()` -> GET `/cars`
- `getById(id)` -> GET `/cars/:id`
- `getConfigs(carId)` -> GET `/cars/:id/configs`
- `create(carData)` -> POST `/cars` (admin only)
- `update(id, carData)` -> PUT `/cars/:id` (admin only)
- `delete(id)` -> DELETE `/cars/:id` (admin only)

#### `ConfigAPI` (admin only on backend)
- `getAll()` -> GET `/configs`
- `getById(id)` -> GET `/configs/:id`
- `create(configData)` -> POST `/configs`
- `update(id, configData)` -> PUT `/configs/:id`
- `delete(id)` -> DELETE `/configs/:id`

#### `CartAPI` (requires auth on backend)
- `get()` -> GET `/cart`
- `addItem(carId, configurationId)` -> POST `/cart`
- `removeItem(itemIndex)` -> DELETE `/cart/item/:itemIndex`
- `clear()` -> DELETE `/cart`

#### `OrdersAPI`
- `getAll()` -> GET `/orders` (current user)
- `getById(id)` -> GET `/orders/:id`
- `create()` -> POST `/orders` (checkout)
- `getAllAdmin()` -> GET `/orders/admin/all` (admin)
- `updateStatus(id, status)` -> PUT `/orders/:id/status` (admin)

### UI helpers block: `UI`
Shared UI utilities used across pages:
- `showToast(message, type)`
  - Ensures `.toast-container` exists, appends a toast element, then removes it after a timeout.
- `showLoading(container)`
  - Replaces container HTML with a loading spinner markup.
- `formatPrice(price)`
  - Formats numbers into USD currency strings.
- `updateCartBadge()`
  - If logged in, fetches cart and updates `.cart-badge` count + visibility.
- `requireAuth()` / `requireAdmin()`
  - Guard helpers that redirect to login or catalog page if user does not meet requirements.
- `updateNav()`
  - Toggles visibility of `.auth-buttons` vs `.user-menu`.
  - Shows/hides `.admin-link` depending on role.
  - Refreshes cart badge.

### DOM initialization block
On `DOMContentLoaded`:
- Calls `UI.updateNav()`.
- Wires up:
  - Mobile menu toggle (`.mobile-toggle` toggles `.navbar-menu.active`)
  - Logout button (calls `Auth.logout()`)

