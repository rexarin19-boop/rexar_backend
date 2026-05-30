# Rexar Backend

Node.js + Express + Firebase Phone Auth + PostgreSQL (Prisma).

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Fill all values in `.env` (see below).

3. Install & database:

```bash
npm install
npm run db:generate
npm run db:push
```

4. Run:

```bash
npm run dev
```

On startup the terminal prints the line for **Rexar** app `.env`:

`EXPO_PUBLIC_API_URL=http://192.168.x.x:4000`

Or run anytime: `npm run print-url`

## Auth modes

| `AUTH_MODE` | JWT secrets needed? | Protected API header |
|-------------|----------------------|----------------------|
| `firebase` (default) | **No** | `Bearer <Firebase idToken>` |
| `jwt` | Yes | `Bearer <accessToken>` |

Start with **`firebase`** — add JWT later by setting `AUTH_MODE=jwt` and secrets.

## Environment variables

| Name | Description |
|------|-------------|
| `AUTH_MODE` | `firebase` or `jwt` |
| `NODE_ENV` | `development` / `production` |
| `PORT` | API port (default `4000`) |
| `API_PREFIX` | `/api/v1` |
| `CORS_ORIGIN` | `*` or comma-separated origins |
| `DATABASE_URL` | PostgreSQL connection string |
| `FIREBASE_PROJECT_ID` | From Firebase service account |
| `FIREBASE_CLIENT_EMAIL` | From service account |
| `FIREBASE_PRIVATE_KEY` | From service account (keep `\n`) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Optional JSON file path |
| `JWT_ACCESS_SECRET` | Long random string |
| `JWT_REFRESH_SECRET` | Long random string |
| `JWT_ACCESS_EXPIRES_IN` | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_IN` | e.g. `7d` |

## Auth flow (mobile → API)

### Mode: `firebase` (no JWT yet)

1. App: Firebase OTP → **idToken**
2. `POST /api/v1/auth/verify` `{ "idToken" }` → `{ user }` or `needsRegistration`
3. `POST /api/v1/auth/register` if new user
4. `GET /api/v1/auth/me` with `Authorization: Bearer <same Firebase idToken>`

### Mode: `jwt` (later)

Same verify/register, then use `accessToken` / `refreshToken` from response.

## API endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |
| POST | `/api/v1/auth/verify` | No |
| POST | `/api/v1/auth/register` | No |
| POST | `/api/v1/auth/refresh` | No |
| POST | `/api/v1/auth/logout` | No |
| GET | `/api/v1/auth/me` | Bearer token (registered user) |
| GET | `/api/v1/auth/getMe` | Bearer Firebase idToken (user or `null`) |
| POST | `/api/v1/auth/createMe` | Bearer + `{ displayName }` (Excelrs-style signup) |
