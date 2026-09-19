# Suvidha

Suvidha is an India-focused smart apartment management platform: **Smarter Living. Faster Solutions.** The repository contains the React frontend and an Express/Mongoose API. MongoDB Atlas credentials stay in `.env`, never in source control.

## 1. Configure MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/atlas.
2. Create a database user and password.
3. In **Network Access**, add your current IP address. For local-only development, `0.0.0.0/0` works but is less restrictive.
4. Select **Connect > Drivers**, copy the connection string, and replace the placeholders.

Copy `.env.example` to `.env` in the project root:

```powershell
Copy-Item .env.example .env
```

Then set `MONGODB_URI`, a long `JWT_SECRET`, and optionally `PAYMENT_MODE=TEST` in `.env`. Use `PAYMENT_MODE=RAZORPAY` with `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` only after configuring the gateway.

## 2. Run the application

Install dependencies once:

```powershell
npm install
```

Run frontend and backend together:

```powershell
npm run dev:full
```

Frontend: http://localhost:5173  
API health check: http://localhost:5000/api/health

You can also run them separately with `npm run dev` and `npm run server:dev`.

## Main flows

- Owner: `/owner/register` -> `/owner/login` -> create property -> add apartments -> assign residents -> generate invoices.
- Resident: `/resident/login` -> view assigned apartment -> view owner-generated invoices -> create and verify payment orders.
- Staff: `/staff/login` -> view complaints assigned to the staff account.

## API endpoints

- `POST /api/auth/owner/register` creates an owner and first property.
- `POST /api/auth/owner/login`, `POST /api/auth/resident/login`, `POST /api/auth/staff/login` return role-specific JWTs.
- `GET /api/auth/me` returns the logged-in user.
- `GET/POST /api/properties` and `PUT /api/properties/:id` manage owner properties.
- `GET/POST /api/apartments`, `PUT /api/apartments/:id`, and `POST /api/apartments/:id/assign` manage flats and resident access.
- `GET/POST /api/residents` and `PUT /api/residents/:id` provide owner-scoped resident management.
- `GET /api/invoices` and `POST /api/invoices/generate` manage database-backed monthly invoices.
- `POST /api/payments/create` creates a server-side TEST or Razorpay order.
- `POST /api/payments/verify` verifies the test confirmation or Razorpay signature before marking an invoice paid.
- `GET /api/payments/history` returns owner-scoped or resident-scoped payment history.
- `GET /api/complaints` lists only the current resident's, staff's assigned, or owner's property complaints.
- `POST /api/complaints` stores a complaint using the resident's server-side property assignment.
- `PATCH /api/complaints/:id` updates status/assignment and creates a resident notification.
- `POST /api/complaints/:id/updates` adds a complaint update.
- `GET /api/notifications` and `PUT /api/notifications/:id/read` manage user notifications.

Send the token in requests as `Authorization: Bearer <token>`.

Every protected endpoint requires `Authorization: Bearer <token>`. Property and resident queries are scoped by the authenticated owner or resident assignment.

## Suvidha modules

- Resident dashboard with problem resolution stats, quick actions and notifications.
- Smart problem reporting with keyword-based category, priority and staff suggestions.
- Similar unresolved issue prompts that let residents follow a shared problem.
- Complaint verification, reopen-ready status journey and affected-resident counts.
- Resident maintenance payments with a clearly labelled server-verified TEST MODE.
- Owner apartment, resident, charge, invoice and collection workflows backed by MongoDB.
- Role-specific owner, resident and maintenance staff access.

TEST MODE never accepts a browser-only success flag: it creates an order on the server and requires `/api/payments/verify` with the server-side test confirmation. The Razorpay path verifies the gateway signature and webhook secret before updating the invoice.
