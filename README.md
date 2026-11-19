# Seoulmate — Modern Korean Restaurant (MERN)

A full-stack restaurant web app: customers can browse the menu, order food with online payment, and reserve a table from a 3D floor plan. Staff manage everything from role-based dashboards.

**Live demo:** _coming soon_

## Features

**Customers**
- Browse the menu (loaded from MongoDB) and open a detail page for each dish
- Cart with quantity controls (saved per user)
- Online payment with Razorpay (test mode) and order confirmation email
- Order history with live fulfilment status (placed → preparing → ready → delivered)
- Table reservation with an interactive 3D floor plan (Three.js), date/time based availability and guest count
- "My Bookings" page to track and cancel pending reservations
- Email/password signup and Google sign-in

**Staff (Admin / Owner)**
- Admin dashboard: reservations (confirm/cancel), users, orders, menu manager
- Owner dashboard: overview stats, promote/demote admins, plus everything admins can do
- Menu manager: add, edit, hide and delete dishes with image upload

## Tech stack

- **Frontend:** React 18, Vite, React Router, Three.js, Google OAuth
- **Backend:** Node.js, Express 5, Mongoose
- **Database:** MongoDB Atlas
- **Auth and security:** JWT, bcrypt, Helmet, rate limiting, role checks against the database on every request
- **Payments / email / uploads:** Razorpay, Nodemailer, Multer

## Notable engineering details

- Prices are always calculated on the server from the database, never trusted from the client
- Razorpay payment signatures are verified on the server before an order is marked paid
- Double-booking is prevented with a per-table, per-date lock plus a 2-hour slot overlap check
- Booking rules are enforced on the server: opening hours, no past times (IST), guests must fit the table
- Role is read from the database on each request, so promoting/demoting a user takes effect immediately
- The Three.js code is lazy-loaded, so it does not slow down the first page load

## Project structure

```
SeoulmateMERN/
├─ client/   React + Vite frontend
│  └─ src/ (components, pages, context, config, utils)
└─ server/   Express API
   ├─ controllers/  models/  routes/  middleware/  utils/
   ├─ data/         fixed table layout
   └─ seed.js       one-time menu seeding
```

## Getting started

**Prerequisites:** Node.js 18+, a MongoDB Atlas database, and (optional) Google OAuth, Razorpay test and Gmail app-password credentials.

1. Clone the repo and install dependencies

   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. Create the env files from the examples and fill in the values

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Use a long random string for `JWT_SECRET`, for example:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. (Optional) Seed the starter menu into an empty database

   ```bash
   cd server && node seed.js
   ```

   Note: seeding clears the Dish collection first.

4. Run both apps in two terminals

   ```bash
   cd server && npm run dev     # http://localhost:5000
   cd client && npm run dev     # http://localhost:5173
   ```

## Roles

| Role  | How it is created |
|-------|-------------------|
| User  | Normal signup or Google sign-in |
| Admin | The owner promotes an existing user from the Owner dashboard |
| Owner | Single account defined by `OWNER_EMAIL` / `OWNER_PASSWORD` in `server/.env`, log in at `/owner` |

## Environment variables

Server: `PORT`, `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `OWNER_EMAIL`, `OWNER_PASSWORD`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `CLIENT_URL`, `SERVER_URL`

Client: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`

Never commit real `.env` files.

## Screenshots

_Add screenshots of the home page, floor plan, menu, orders and dashboards here._

## Roadmap

- Cloud image storage, Razorpay webhook, forgot-password flow
- Email notifications for reservations, real dish reviews
- Order types (dine-in / takeaway) and admin analytics