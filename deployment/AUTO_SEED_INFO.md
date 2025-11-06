# 🌱 Automatic Database Seeding

The backend container now **automatically seeds the database** when it starts for the first time!

## What Gets Seeded?

### 👥 Users (2)
- **Admin Account**
  - Email: `admin@fashion.com`
  - Password: `admin123`
  - Role: ADMIN
  
- **Customer Account**
  - Email: `customer@example.com`
  - Password: `customer123`
  - Role: CUSTOMER

### 📁 Categories (4)
- Women
- Men
- Accessories
- Shoes

### 👕 Products (24)
A variety of fashion items including:
- Dresses & Evening Wear
- Jackets & Coats
- Shirts & Tops
- Pants & Jeans
- Shoes (Sneakers, Boots, Heels, Loafers)
- Accessories (Bags, Wallets, Sunglasses, Belts, Scarves)

## How It Works

When the backend container starts:

1. ✅ Waits for database connection
2. ✅ Runs database migrations (`npm run db:push`)
3. ✅ Checks if products already exist
4. ✅ **Only seeds if database is empty** (no duplicate data!)
5. ✅ Starts the application server

## Smart Seeding

The entrypoint script is intelligent:
- **First Run:** Seeds the database with all data
- **Subsequent Runs:** Skips seeding (data already exists)
- **After Reset:** If you delete data, it will re-seed automatically

## Manual Seeding

If you want to manually seed the database:

```bash
# Enter the backend container
docker compose exec backend sh

# Run the seed script
npm run seed
```

## Reset Database & Re-seed

To start fresh:

```bash
# Stop all containers and remove volumes
docker compose down -v

# Start again (will automatically seed)
docker compose up -d

# Wait for seeding to complete
sleep 30

# Check if data is there
curl http://localhost:3000/api/products
```

## Logs

To see the seeding process:

```bash
# Watch backend logs
docker compose logs -f backend

# You should see:
# 🚀 Starting Fashion E-commerce Backend...
# ⏳ Waiting for database to be ready...
# ✅ Database is ready
# 📦 Running database migrations...
# 🌱 Seeding database with initial data...
# ✅ Created users
# ✅ Created categories
# ✅ Created products
# 🎉 Seed completed successfully!
```

## Test the Seeded Data

### Login as Admin
```bash
# POST to /api/auth/login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fashion.com","password":"admin123"}'
```

### Get All Products
```bash
curl http://localhost:3000/api/products
```

### Get All Categories
```bash
curl http://localhost:3000/api/categories
```

## Troubleshooting

### Seed Not Running?
Check the logs:
```bash
docker compose logs backend | grep -A 20 "Seeding"
```

### Database Already Has Data?
The script will skip seeding:
```
✅ Database already has 24 products, skipping seed
```

### Force Re-seed?
Delete volumes and restart:
```bash
docker compose down -v
docker compose up -d
```

---

**Note:** The seed script is located at `server/seed.ts` and can be customized to add more products or change existing ones.
