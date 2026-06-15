# Rexar Backend

Node.js + Express + Firebase Auth + MongoDB (direct driver, no ORM).

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Fill `.env` — especially `DATABASE_URL` (MongoDB) and Firebase service account.

3. Install & run:

```bash
npm install
npm run dev
```

4. Test DB connection (optional):

```bash
npm run db:test
```

App `.env` (Rexar mobile): `API_URL=http://localhost:4000` — run `npm run android` (auto adb-reverse).

## Auth mode

Default: **`firebase`** — app sends Firebase `idToken` in `Authorization: Bearer <token>`.

## Environment variables

| Name | Description |
|------|-------------|
| `AUTH_MODE` | `firebase` (default) or `jwt` |
| `NODE_ENV` | `development` / `production` |
| `PORT` | API port (default `4000`) |
| `DATABASE_URL` | MongoDB connection string |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase admin JSON |

## Auth flow

1. **Signup:** Phone OTP → email + password → `POST /api/v1/auth/createMe`
2. **Login:** Phone/email + password (Firebase) → `GET /api/v1/auth/getMe`
3. **Resolve login:** `POST /api/v1/auth/resolve-login` `{ "identifier" }` → `{ loginEmail }`

## API endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |
| POST | `/api/v1/auth/resolve-login` | No |
| GET | `/api/v1/auth/getMe` | Bearer Firebase idToken |
| POST | `/api/v1/auth/createMe` | Bearer + profile body |
| POST | `/api/v1/tournaments` | Bearer + ORGANIZER role |
