#!/bin/sh
set -e

echo "🚀 Starting Fashion E-commerce Backend..."

# Wait for database to be ready. Prefer DATABASE_URL (Secrets Manager) if provided,
# otherwise fall back to host/user environment variables (or default to 'postgres').
echo "⏳ Waiting for database to be ready..."
max_retries=30
counter=0

wait_for_db_using_psql() {
  # psql accepts a connection string like: postgres://user:pass@host:port/dbname
  psql "$DATABASE_URL" -c '\q' > /dev/null 2>&1
}

wait_for_db_using_pg_isready() {
  local host="$1"
  local user="$2"
  pg_isready -h "$host" -U "$user" > /dev/null 2>&1
}

if [ -n "$DATABASE_URL" ]; then
  until wait_for_db_using_psql || [ $counter -eq $max_retries ]; do
    counter=$((counter + 1))
    echo "Database not ready yet (using DATABASE_URL), waiting... (attempt $counter/$max_retries)"
    sleep 2
  done
else
  DB_HOST=${DATABASE_HOST:-postgres}
  DB_USER=${DATABASE_USER:-postgres}
  until wait_for_db_using_pg_isready "$DB_HOST" "$DB_USER" || [ $counter -eq $max_retries ]; do
    counter=$((counter + 1))
    echo "Database not ready yet (host=$DB_HOST user=$DB_USER), waiting... (attempt $counter/$max_retries)"
    sleep 2
  done
fi

if [ $counter -eq $max_retries ]; then
  echo "❌ Database did not become ready in time"
  exit 1
fi

echo "✅ Database is ready"

# Run database migrations
echo "📦 Running database migrations..."
npm run db:push || {
  echo "⚠️  Migrations already applied or failed, continuing..."
}

# Check if database is already seeded and run seed if needed
echo "🌱 Checking if database needs seeding..."
npx tsx --tsconfig tsconfig.json -e "
  import { db } from './server/db.js';
  import { products } from './shared/schema.js';
  db.select().from(products).then(result => {
    if (result.length === 0) {
      console.log('Database is empty, needs seeding');
      process.exit(1);
    } else {
      console.log(\`Database already has \${result.length} products, skipping seed\`);
      process.exit(0);
    }
  }).catch((err) => {
    console.error('Error checking products:', err.message);
    console.log('Assuming database needs seeding');
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
  echo "🌱 Seeding database with initial data..."
  npx tsx --tsconfig tsconfig.json server/seed.ts || {
    echo "⚠️  Seeding failed, but continuing..."
  }
fi

# Start the application
echo "🎉 Starting application server..."
exec node dist/index.js

