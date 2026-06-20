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

## Deploy (CLI — single `master` branch)

Project: **`rexar-ea718`** | Region: **`asia-south1`** | Service: **`rexar-api`**

Sirf **`master`** branch — staging/main alag nahi. Sab code + deploy yahi se.

### Git setup (ek baar)

```powershell
git checkout staging
git checkout -b master
git push -u origin master
```

Baad mein daily kaam:

```powershell
git checkout master
git push origin master
```

Purani `staging` / `main` branches delete karna optional hai.

### Deploy — CLI se (GitHub browser login nahi)

Browser wala **Connect repository / GitHub OTP** band karo. PC se seedha deploy:

**Ek baar install + login (Google account — GitHub nahi):**

```powershell
winget install Google.CloudSDK
# terminal restart
gcloud auth login
gcloud config set project rexar-ea718
```

**Har deploy par sirf ye command** (`Rexar_BackEnd` folder se):

```powershell
.\scripts\deploy-cloud-run.ps1
```

Script automatically:
- `.env` se `DATABASE_URL` leta hai
- `secrets/firebase-service-account.json` se Firebase keys leta hai
- Cloud Run par deploy karta hai (`rexar-api`, region `asia-south1`)

> GitHub repo connect karne ki zaroorat nahi — baar baar OTP nahi aayega.

### Optional — GitHub se auto-deploy

Agar baad mein har `git push master` par auto-deploy chahiye, tab Cloud Run → Connect repository → branch **`master`**.

### Cloud Run secrets (reference)

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

Deploy ke baad URL copy karo, e.g. `https://rexar-api-xxxxx.a.run.app`

Test: `https://YOUR-URL/health` → `"db": "connected"`

### Mobile APK

`Rexar/.env`:

```
REXAR_PROD_API_URL=https://rexar-api-xxxxx.a.run.app
```

```bash
npm run build:apk:prod
```

### Daily workflow

```
master par code push → .\scripts\deploy-cloud-run.ps1 → APK rebuild → test
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
