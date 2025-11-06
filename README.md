# Fashion-Fusion — Run locally

This repository contains a full-stack Vite + Express app. The server bundles the client in production. Below are instructions to run it locally (PowerShell) and with Docker Compose.

## Prerequisites
- Node.js 18+ (recommended)
- npm (bundled with Node)
- A Postgres-compatible database (local or cloud). Docker is the quickest way to run Postgres locally.
- Docker & Docker Compose (if you want to use Docker)

## Quick: run locally (PowerShell)
1. Install dependencies

```powershell
npm install
```

2. Set environment variables for the session (PowerShell)

```powershell
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/fashion'
$env:PORT = '5000'
```

3. Apply migrations

```powershell
npm run db:push
```

4. (Optional) Seed demo data

```powershell
npx tsx server/seed.ts
```

5. Start dev server (backend + vite dev middleware)

```powershell
npm run dev
```

Open http://localhost:5000

## Run with Docker Compose (recommended for reproducible dev)

1. Copy `.env.example` to `.env` and edit if you want. By default compose uses a local Postgres container.

2. Start services

```powershell
cat > .env << 'EOF'
POSTGRES_PASSWORD=SimplePass123
JWT_ACCESS_SECRET=st7NdZ0ajIy2VDgShc+pZl2BpgXwN8ULBUEJoYrVwyM=
JWT_REFRESH_SECRET=We9OJic3RyUZcVOlZknOFtpe/Mc3cpnWEO83D2NtYc0=
EOF

docker compose up --build
```

This will build the `api` and `web` images and start Postgres. The services are mapped to host ports:

- api: http://localhost:5000 (API endpoints)
- web: http://localhost:3000 (static client served by nginx)

The nginx in the `web` container proxies requests under `/api` to the `api` service, so client-side code using relative `/api` paths will continue to work.

3. Seed the database (one-off)

```powershell
docker compose run --rm seed
```

This runs the `db:push` migration and executes the seed script against the `db` service.

## Production build (locally)

Build the client and bundle the server:

```powershell
npm run build
```

Start the built server (ensure `DATABASE_URL` and production JWT secrets are set):

```powershell
$env:DATABASE_URL = '...'
$env:JWT_ACCESS_SECRET = '...'
$env:JWT_REFRESH_SECRET = '...'
npm run start
```

## Notes & troubleshooting
- If you get an error saying `DATABASE_URL must be set`, export the env var in the same shell session before running the app.
- Cloudinary upload requires `CLOUDINARY_*` env vars.
- If `npx tsx` fails, install `tsx` dev dependency: `npm install -D tsx`.

## Files added
- `Dockerfile.api` — multi-stage build for the API/service.
- `Dockerfile.web` — multi-stage build for the client static site (served via nginx) and nginx config.
- `docker-compose.yml` — Postgres, `api`, `web`, and a `seed` one-off service.
- `nginx.conf` — nginx config for the `web` service to proxy `/api` to the `api` service.
- `.env.example` — example env vars.
- `.dockerignore` — reduce build context.
- `README.md` — this file.

If you want, I can:
- Add an `npm run seed` script (already added),
- Add a simple `Makefile` or PowerShell script to set env vars automatically on Windows,
- Create a `docker-compose.override.yml` to mount local code for live-editing the app inside the container.
