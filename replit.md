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

## AWS Deployment

The project includes **100% automated CloudFormation deployment** for AWS ECS Fargate with RDS and Secrets Manager.

### Quick Deploy to AWS

```bash
# 1. Create parameters file from template
cp cloudformation/parameters-template.json cloudformation/parameters.json

# 2. Edit parameters.json with your AWS values

# 3. Deploy (15-20 minutes)
aws cloudformation create-stack \
  --stack-name fashion-fusion \
  --template-body file://cloudformation/complete-stack.yaml \
  --parameters file://cloudformation/parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Documentation Files

- **`CLOUDFORMATION_DEPLOYMENT_GUIDE.md`** - Complete automated deployment guide
- **`AWS_ECS_FARGATE_DEPLOYMENT.md`** - Manual step-by-step AWS setup
- **`AWS_TROUBLESHOOTING_CHECKLIST.md`** - Fix database and image loading issues
- **`cloudformation/README.md`** - CloudFormation templates overview

### What Gets Auto-Created

✅ RDS PostgreSQL with auto-generated password  
✅ Secrets Manager (DATABASE_URL, JWT secrets)  
✅ Security Groups with proper rules  
✅ ECS Fargate cluster and service  
✅ Application Load Balancer  
✅ CI/CD Pipeline (CodePipeline + CodeBuild)  
✅ CloudWatch logging

**Cost:** ~$98/month (optimizable to ~$66/month)

## Recent Changes
- **2025-11-16**: GitHub import setup completed for Replit environment
  - Installed all npm dependencies (500 packages)
  - Applied database migrations using Drizzle ORM
  - Added `allowedHosts: true` to Vite config for Replit proxy compatibility
  - Configured dev workflow on port 5000 with webview output
  - Database auto-seeded with 100 products from DummyJSON API
  - Frontend and backend running successfully on single port 5000
  - Deployment configured for autoscale with build and start commands
  - Application tested and verified working:
    - ✅ Hero section loading correctly
    - ✅ Product images displaying from DummyJSON CDN
    - ✅ User registration working
    - ✅ Shopping cart and wishlist functional
  - Created comprehensive AWS ECS Fargate deployment guide with RDS and Secrets Manager integration

- **2025-11-13**: GitHub import to Replit environment completed
  - Installed all npm dependencies (500 packages)
  - Applied database migrations using Drizzle ORM
  - Configured dev workflow on port 5000 with webview output
  - Verified Vite config allows all hosts (line 26: `allowedHosts: true`)
  - Database auto-seeded with 100 products from DummyJSON API
  - Frontend and backend running successfully on single port 5000
  - Deployment configured for autoscale with build and start commands
  - Application tested and verified working with hero section, navigation, and full UI

- **2025-11-06**: Initial Replit setup and optimization
  - Configured Vite HMR for Replit proxy (clientPort: 443)
  - Set up workflow to run on port 5000
  - Database provisioned and migrations applied
  - **Switched to web-hosted product images (DummyJSON API)**
    - Pulls 100 products with real images from web (no local storage needed)
    - Product images hosted on CDN: https://cdn.dummyjson.com
    - Categories: Women (52), Men (16), Accessories (32)
    - Works perfectly in all environments: Docker, Replit, local development
  - **Cleaned up attached_assets folder and Docker files**
    - Removed 26 old generated images from local storage
    - Removed development screenshots and text files
    - Removed attached_assets COPY commands from Docker files
    - Updated hero image imports to use web-hosted image (Unsplash)
    - Fixed Docker build errors from missing local images
    - Folder now empty (static file serving kept for future use)
    - Docker containers no longer copy empty folder during build

## User Preferences
None specified yet.

## Notes
- The application uses Neon serverless PostgreSQL driver for Replit environment
- Auto-seeding runs on server startup if database is empty
- In development, Vite middleware serves the frontend; in production, static files are served
- JWT secrets are auto-generated in development but should be set in production
