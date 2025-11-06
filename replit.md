# Fashion-Fusion E-commerce Platform

## Overview
Full-stack e-commerce application built with React (Vite) frontend and Express backend. Features include product catalog, shopping cart, user authentication, order management, and admin dashboard.

## Architecture
- **Frontend**: React 18 + Vite + TailwindCSS + Radix UI components
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (via Drizzle ORM)
- **Authentication**: Passport.js with JWT tokens
- **File Storage**: Cloudinary (optional, for product images)

## Tech Stack
- **Framework**: Vite + Express (monorepo structure)
- **UI Library**: React with Radix UI primitives
- **Styling**: TailwindCSS with custom animations
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod validation
- **Database ORM**: Drizzle ORM
- **WebSockets**: ws library for real-time features

## Project Structure
```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts (Auth)
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # API client, utilities
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── auth.ts          # Authentication logic
│   ├── db.ts            # Database connection
│   ├── seed.ts          # Database seeding
│   └── vite.ts          # Vite dev middleware
├── shared/              # Shared types/schemas
│   └── schema.ts        # Drizzle schema definitions
├── migrations/          # Database migrations
└── attached_assets/     # Static files served by Express

## Database Setup
The application requires a PostgreSQL database. The DATABASE_URL environment variable must be set.

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (required)

**Optional Environment Variables:**
- `JWT_ACCESS_SECRET` - JWT access token secret (auto-generated in dev)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (auto-generated in dev)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `PORT` - Server port (defaults to 5000)

## Development
The server runs on port 5000 and serves both the API (`/api/*`) and the frontend (Vite dev middleware in development mode).

**Database Migrations:**
Run `npm run db:push` to apply schema changes to the database.

**Database Seeding:**
The server auto-seeds the database on first run if empty. Manual seeding: `npm run seed`

## Features
- Product catalog with categories and filtering
- Shopping cart with persistent storage
- User authentication (register/login)
- Order management and tracking
- Admin dashboard for product management
- Wishlist functionality
- Responsive design with theme toggle (light/dark)
- Real-time updates via WebSockets

## Recent Changes
- **2025-11-06**: Initial Replit setup
  - Configured Vite HMR for Replit proxy (clientPort: 443)
  - Set up workflow to run on port 5000
  - Database requires provisioning via Replit UI
  - **Updated seed data to fetch products from DummyJSON API**
    - Pulls 100+ products with real images from web (no local storage)
    - Product images hosted on CDN: https://cdn.dummyjson.com
    - Works in all environments: Docker, Replit, local development

## User Preferences
None specified yet.

## Notes
- The application uses Neon serverless PostgreSQL driver for Replit environment
- Auto-seeding runs on server startup if database is empty
- In development, Vite middleware serves the frontend; in production, static files are served
- JWT secrets are auto-generated in development but should be set in production
