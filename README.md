# Restaurant Reservation System With DevOps

A full-stack **role-based seat booking** application with **Owner**, **Admin**, and **User** roles. Built with Node.js, Express, MySQL (Sequelize ORM), JWT auth, and React. Supports real-time seat availability, overbooking prevention, and RBAC.

## Tech Stack

| Layer   | Technologies                          |
|---------|---------------------------------------|
| Backend | Node.js, Express.js, MySQL, Sequelize, JWT, bcrypt, express-validator, morgan, dotenv |
| Frontend| React, Axios, React Router, minimal UI |

## Roles & Capabilities

| Role   | Capabilities |
|--------|--------------|
| **Owner** | Add/manage own restaurants, set total seats, view booking status, see seat reduction when users book, prevent overbooking |
| **Admin** | Monitor app (users count, restaurants count, booking stats daily/weekly/monthly, total seats booked), read-only activity logs |
| **User**  | Register/login, browse restaurants, select date & time slot, check real-time availability, book seats, view confirmation; booking blocked when seats insufficient |

## Project Structure

```
restaurant-reservation-system/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── models/ (User, Restaurant, Reservation, ActivityLog)
│   │   ├── controllers/ (auth, restaurant, reservation, admin)
│   │   ├── routes/ (auth, restaurant, reservation, admin)
│   │   ├── middlewares/ (auth, role, error)
│   │   ├── utils/ (generateToken, activityLogger)
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/ (Login, Register, Restaurants, BookReservation, OwnerDashboard, AdminDashboard)
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Backend Setup

1. **Clone and enter backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Fill in MySQL credentials and JWT secret (see [.env configuration](#env-configuration) below)

4. **Create MySQL database:**
   - Create a database (e.g. `reservation_db`) in MySQL
   - Ensure `DB_NAME` in `.env` matches

5. **Start server:**
   ```bash
   npm start
   ```
   Server runs on `http://localhost:5000` (or `PORT` from `.env`). Sequelize will create/sync tables on first run.

   **If upgrading from an older schema:** run once with `alter: true` in `server.js` (change `sequelize.sync({ alter: false })` to `sequelize.sync({ alter: true })`) to add `owner_id` on `restaurants`, create `activity_logs`, and add `owner` to the `users.role` ENUM. Then switch back to `alter: false`.

   **If you see "Data truncated for column 'role'" when registering as Owner:** the `users.role` column still has the old ENUM. Run the migration: `mysql -u YOUR_USER -p YOUR_DB < backend/migrations/add-owner-role.sql` (or run the SQL in that file manually).

## Frontend Setup

1. **Enter frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:3000` and proxies `/api` to the backend.

## .env Configuration

Create `backend/.env` from `backend/.env.example`. **Do not hardcode credentials.**

Required variables:

| Variable     | Description                    | Example        |
|-------------|--------------------------------|----------------|
| `PORT`      | Backend port                   | `5000`         |
| `NODE_ENV`  | Environment                    | `development`  |
| `JWT_SECRET`| Secret for signing JWT         | (strong random string) |
| `DB_HOST`   | MySQL host                     | `localhost`    |
| `DB_PORT`   | MySQL port                     | `3306`         |
| `DB_NAME`   | Database name                  | `reservation_db` |
| `DB_USER`   | MySQL user                     | `root`         |
| `DB_PASSWORD` | MySQL password               | (your password) |

Optional: `JWT_EXPIRE` (default `7d`) for token expiry.

## Database Schema Overview

### users

| Column     | Type         | Notes              |
|------------|--------------|--------------------|
| id         | INT (PK)     | Auto-increment     |
| name       | VARCHAR(255) |                    |
| email      | VARCHAR(255) | Unique             |
| password   | VARCHAR(255) | Hashed (bcrypt)    |
| role       | ENUM         | `user`, `admin`, `owner` |
| created_at | DATETIME     |                    |
| updated_at | DATETIME     |                    |

### restaurants

| Column      | Type         | Notes        |
|-------------|--------------|-------------|
| id          | INT (PK)     | Auto-increment |
| name        | VARCHAR(255) |              |
| cuisine     | VARCHAR(255) |              |
| location    | VARCHAR(255) |              |
| rating      | DECIMAL(3,2) | Optional    |
| total_seats | INT          | Required (capacity) |
| owner_id    | INT (FK)     | → users.id (nullable) |
| created_at  | DATETIME     |              |
| updated_at  | DATETIME     |              |

### activity_logs

| Column     | Type         | Notes        |
|------------|--------------|-------------|
| id         | INT (PK)     | Auto-increment |
| action     | VARCHAR(50)  | e.g. register, login, create |
| entity     | VARCHAR(50)  | e.g. user, reservation |
| entity_id  | INT          | Optional    |
| user_id    | INT (FK)     | → users.id, optional |
| metadata   | JSON         | Optional    |
| created_at | DATETIME     |              |

### reservations

| Column         | Type         | Notes                    |
|----------------|--------------|--------------------------|
| id             | INT (PK)     | Auto-increment           |
| user_id        | INT (FK)     | → users.id               |
| restaurant_id  | INT (FK)     | → restaurants.id         |
| date           | DATE         |                          |
| time           | VARCHAR(10)  |                          |
| guests         | INT          |                          |
| contact_number | VARCHAR(20)  |                          |
| created_at     | DATETIME     |                          |
| updated_at     | DATETIME     |                          |

**Seat capacity:** Multiple reservations can share the same restaurant + date + time; total `guests` for that slot must not exceed the restaurant’s `total_seats`.

## API Documentation

Base URL: `http://localhost:5000/api` (or your `PORT`).

### Auth (public)

| Method | Endpoint              | Body / Params | Description     |
|--------|------------------------|---------------|-----------------|
| POST   | `/auth/register`       | `name`, `email`, `password`, `role?` (`user` \| `owner` \| `admin`) | Register user |
| POST   | `/auth/login`          | `email`, `password` | Login, returns JWT |

Responses include `token`; send it as `Authorization: Bearer <token>` for protected routes.

### Restaurants

| Method | Endpoint                | Access   | Description              |
|--------|--------------------------|----------|--------------------------|
| GET    | `/restaurants`           | Public   | List all restaurants     |
| GET    | `/restaurants/search?q=` | Public   | Search by name/cuisine/location |
| GET    | `/restaurants/:id/availability?date=&time=` | Public | Real-time seats for slot (`totalSeats`, `booked`, `available`) |
| GET    | `/restaurants/my`        | Owner    | List restaurants owned by current user |
| GET    | `/restaurants/:id/bookings` | Owner | Booking status for own restaurant |
| POST   | `/restaurants`           | Owner    | Add restaurant (`totalSeats` required); sets `ownerId` |
| PUT    | `/restaurants/:id`       | Owner    | Update own restaurant (e.g. total seats) |
| DELETE | `/restaurants/:id`       | Owner    | Delete own restaurant        |

### Reservations (protected)

| Method | Endpoint           | Access  | Description                |
|--------|---------------------|---------|----------------------------|
| POST   | `/reservations`     | User    | Create reservation (transaction + lock to prevent overbooking) |
| GET    | `/reservations/my`  | User    | Get current user's reservations |

**Create reservation body:** `restaurantId`, `date` (YYYY-MM-DD), `time` (24h `HH:mm`), `guests`, `contactNumber`.

If `guests` would exceed available seats for that restaurant + date + time, returns **409 Conflict**. Booked seats are deducted in real time; slot is disabled when available = 0.

### Admin (read-only)

| Method | Endpoint                | Access | Description              |
|--------|--------------------------|--------|--------------------------|
| GET    | `/admin/stats`           | Admin  | Users count, restaurants count, bookings (daily/weekly/monthly), total seats booked |
| GET    | `/admin/activity-logs`  | Admin  | System activity logs (limit, offset) |

## Core Features

- **RBAC:** Owner (manage own restaurants & seats), Admin (monitor only), User (book seats).
- **Real-time seat availability:** Availability computed from `totalSeats` minus sum of `guests` per (restaurant, date, time); updates on every booking
- **Overbooking prevention:** Reservation creation runs in a transaction with row lock; insufficient seats return 409.
- **Activity logging:** Register, login, and reservation create are logged for Admin dashboard.
- **Security:** JWT, role middleware, express-validator, centralized error handling.

## Running the App

1. Start MySQL and ensure the database exists.
2. In `backend`: set `.env` (including MySQL credentials), then `npm start`.
3. In `frontend`: `npm run dev`.
4. Open `http://localhost:3000` — register as **User**, **Owner**, or **Admin**. Owners get "My Restaurants" and can add/manage restaurants; Admins get "Admin Dashboard" (stats + activity logs); Users browse and book seats. Booking is blocked when the slot is fully booked.
