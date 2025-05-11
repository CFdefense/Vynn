#!/bin/bash
set -e

echo "🚀 Starting Render deployment setup script"

# Parse DATABASE_URL to extract components if not directly provided
if [ -n "$DATABASE_URL" ]; then
    echo "📊 Extracting database connection details from DATABASE_URL"
    # Extract connection details from DATABASE_URL (postgres://user:password@host:port/dbname)
    DB_USER=$(echo $DATABASE_URL | sed -n 's/^postgres:\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/^postgres:\/\/[^:]*:\([^@]*\).*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/^postgres:\/\/[^@]*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/^postgres:\/\/[^:]*:[^@]*@[^:]*:\([0-9]*\).*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/^postgres:\/\/[^\/]*\/\(.*\)$/\1/p')
fi

# Verify required environment variables
echo "✅ Verifying environment variables"
[ -z "$BIND_ADDRESS" ] && echo "⚠️ BIND_ADDRESS not set, will use default" || echo "✓ BIND_ADDRESS: $BIND_ADDRESS"
[ -z "$FRONTEND_URL" ] && echo "⚠️ FRONTEND_URL not set, CORS may not work correctly" || echo "✓ FRONTEND_URL: $FRONTEND_URL"
[ -z "$OPENAI_API_KEY" ] && echo "⚠️ OPENAI_API_KEY not set, AI features will not work" || echo "✓ OPENAI_API_KEY: set"
[ -z "$DATABASE_URL" ] && echo "❌ DATABASE_URL not set - this is required" && exit 1 || echo "✓ DATABASE_URL: set"

# Install SQLx CLI if needed
echo "🔧 Installing SQLx CLI"
cargo install sqlx-cli --no-default-features --features postgres

# Create vector extension
echo "🧩 Ensuring pgvector extension is installed"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p ${DB_PORT:-5432} -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS vector;" || {
    echo "⚠️ Could not create vector extension - AI search features may not work"
}

# Run migrations
echo "🔄 Running database migrations"
sqlx migrate run || {
    echo "❌ Database migrations failed"
    exit 1
}

echo "✅ Database setup complete!"

# Set SQLX_OFFLINE to true for the actual build if not already set
if [ -z "$SQLX_OFFLINE" ]; then
    echo "📝 Setting SQLX_OFFLINE=true for build"
    export SQLX_OFFLINE=true
fi

echo "🏗️ Building project..."
cargo build --release

echo "🚀 Deployment setup complete!"