#!/bin/bash

# This script sets up the PostgreSQL database for the project and generates the SQLx data for offline mode

# Set environment variables
export DATABASE_URL="postgres://postgres:secret@localhost:5431/postgres"
export PGPASSWORD="secret"

echo "Connecting to database at ${DATABASE_URL}..."

# Add ai_credits column to users table if it doesn't exist
echo "Adding ai_credits column to users table if it doesn't exist..."
psql -h localhost -p 5431 -U postgres -d postgres -c "
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'ai_credits'
    ) THEN
        ALTER TABLE users ADD COLUMN ai_credits INT NOT NULL DEFAULT 10;
    END IF;
END \$\$;
"

# Generate SQLx metadata for offline mode
echo "Generating SQLx metadata for offline mode..."
cargo sqlx prepare --database-url "${DATABASE_URL}" -- --lib

echo "Setup complete!" 