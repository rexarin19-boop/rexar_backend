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

## Deploy (branch-based — no Dockerfile / no yaml)

Project: **`rexar-ea718`** | Region: **`asia-south1`**

Sirf **Git branch** se control — koi `cloudbuild.yaml` ya `Dockerfile` maintain nahi karna.

| Branch | Cloud Run service | Use |
|--------|-------------------|-----|
| `staging` | `rexar-api-staging` | v0.1 testing |
| `main` | `rexar-api` | live (jab stable ho) |

### 1) `staging` branch banao (ek baar)

```bash
git checkout -b staging
git push -u origin staging
```

Daily kaam `staging` par karo. Jab sab theek ho → `main` mein merge.

### 2) Cloud Run → Connect repository (staging)

1. [Cloud Run](https://console.cloud.google.com/run?project=rexar-ea718) → **Connect repository**
2. GitHub connect → repo **`zeeshan8302/Rexar_BackEnd`**
3. Settings:
   - **Branch:** `staging`
   - **Build type:** Node.js (Dockerfile mat choose karo)
   - **Service name:** `rexar-api-staging`
   - **Region:** `asia-south1`
   - **Authentication:** Allow unauthenticated
   - **Port:** `8080` (Cloud Run default — app `process.env.PORT` use karti hai)

4. **Variables & Secrets** (service edit → first deploy se pehle):

| Name | Type | Value |
|------|------|-------|
| `DATABASE_URL` | Secret | MongoDB connection string |
| `FIREBASE_PROJECT_ID` | Secret or var | `rexar-ea718` |
| `FIREBASE_CLIENT_EMAIL` | Secret | service account email |
| `FIREBASE_PRIVATE_KEY` | Secret | full private key |
| `NODE_ENV` | Variable | `production` |
| `AUTH_MODE` | Variable | `firebase` |
| `CORS_ORIGIN` | Variable | `*` |
| `API_PREFIX` | Variable | `/api/v1` |

> Local dev mein `FIREBASE_SERVICE_ACCOUNT_PATH` file use hoti hai. Cloud Run par **env vars / secrets** use karo — file path kaam nahi karegi.

5. Deploy → URL copy karo, e.g. `https://rexar-api-staging-xxxxx.a.run.app`

6. Test: `https://YOUR-URL/health` → `"db": "connected"`

Ab har **`staging` push/merge** par API khud redeploy ho jayegi.

### 3) Production (`main`) — baad mein

Jab staging stable ho, wahi steps dobara:

- Branch: **`main`**
- Service name: **`rexar-api`**
- Same secrets (ya alag prod DB baad mein)

### 4) Mobile APK (staging test)

`Rexar/.env`:

```
REXAR_PROD_API_URL=https://rexar-api-staging-xxxxx.a.run.app
```

```bash
npm run build:apk:prod
```

APK testers ko bhejo — Play Store ki zaroorat nahi v0.1 ke liye.

### Daily workflow

```
feature branch → PR → merge staging → API auto-deploy (staging URL)
       ↓
test APK + app on phone
       ↓
merge staging → main → API auto-deploy (prod URL) → new prod APK
```

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
