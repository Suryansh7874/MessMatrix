# Mess Matrix Backend Starter

This is the first backend layer only: Express setup, MongoDB connection, basic security middleware, JSON parsing, a shared API rate limit, error handling, and a health endpoint. Authentication and meal features will be added in later steps.

## 1. Requirements

- Node.js LTS installed
- A MongoDB Atlas database, or a local MongoDB instance

## 2. Install

Open a terminal in this folder:

```bash
npm install
```

Copy `.env.example` to `.env` and replace the MongoDB URI with your real connection string.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Do not commit `.env` or share your database password publicly.

## 3. Run locally

```bash
npm run dev
```

Open:

- `http://localhost:5000/`
- `http://localhost:5000/api/health`

Expected health response when MongoDB is connected:

```json
{
  "success": true,
  "service": "Mess Matrix API",
  "database": "connected",
  "timestamp": "..."
}
```

## 4. Connect the existing Vite frontend

The frontend runs on `http://localhost:5173` by default. This origin is already allowed in `.env.example`. If your frontend uses another origin, update `CLIENT_ORIGIN` and restart the backend.

## Notes

- The health endpoint reports database connectivity, not whether all project features are complete.
- This starter does not yet implement users, authentication, meal schedules, booking, QR check-in, rebates, analytics, or offline sync.
- Keep secrets in environment variables. Never put the MongoDB URI or JWT secret in frontend code.
