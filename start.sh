#!/bin/bash

# Function to check if Docker is running
check_docker() {
  echo "Checking if Docker is running..."
  if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Starting Docker..."
    open -a Docker
    
    # Wait for Docker to start
    echo "Waiting for Docker to start (this may take a minute)..."
    attempts=0
    max_attempts=30
    while ! docker info >/dev/null 2>&1; do
      attempts=$((attempts+1))
      if [ $attempts -ge $max_attempts ]; then
        echo "Docker failed to start after $max_attempts attempts. Please start Docker manually."
        exit 1
      fi
      sleep 2
    done
    echo "Docker is now running!"
  else
    echo "Docker is already running."
  fi
}

# Function to check if a port is in use
check_port() {
  local port=$1
  lsof -i:$port >/dev/null 2>&1
  return $?
}

# Function to apply database migrations
apply_migrations() {
  echo "Applying database migrations..."
  
  # Wait for PostgreSQL to be ready
  echo "Waiting for PostgreSQL to be ready..."
  attempts=0
  max_attempts=10
  while ! docker exec contained-postgres pg_isready -U postgres >/dev/null 2>&1; do
    attempts=$((attempts+1))
    if [ $attempts -ge $max_attempts ]; then
      echo "PostgreSQL failed to start after $max_attempts attempts."
      exit 1
    fi
    sleep 2
  done
  
  # Create database if it doesn't exist
  echo "Creating database if it doesn't exist..."
  docker exec contained-postgres psql -U postgres -c "CREATE DATABASE my_app_db WITH OWNER postgres;" >/dev/null 2>&1 || true
  
  # Apply migrations
  echo "Applying migration scripts..."
  docker cp backend/migrations/01_migration_script.sql contained-postgres:/tmp/
  docker exec contained-postgres psql -U postgres -d my_app_db -f /tmp/01_migration_script.sql
  
  docker cp backend/migrations/02_add_projects.sql contained-postgres:/tmp/
  docker exec contained-postgres psql -U postgres -d my_app_db -f /tmp/02_add_projects.sql
  
  # Create test users
  echo "Creating test users..."
  docker exec contained-postgres psql -U postgres -d my_app_db -c "INSERT INTO users (name, email, password) VALUES ('Test User', 'test@example.com', 'password123') ON CONFLICT (email) DO UPDATE SET password = 'password123';"
  docker exec contained-postgres psql -U postgres -d my_app_db -c "INSERT INTO users (name, email, password) VALUES ('Marko', 'marko61680@gmail.com', 'bathroom75') ON CONFLICT (email) DO UPDATE SET password = 'bathroom75';"
  
  # Create sample document and project
  echo "Creating sample document and project..."
  docker exec contained-postgres psql -U postgres -d my_app_db -c "INSERT INTO projects (id, name, description, owner_id) VALUES (1, 'Sample Project', 'A sample project for testing', 1) ON CONFLICT (id) DO UPDATE SET name = 'Sample Project', description = 'A sample project for testing';"
  docker exec contained-postgres psql -U postgres -d my_app_db -c "INSERT INTO documents (id, name, content, user_id) VALUES (1, 'Sample Document', 'This is a sample document. You can edit it using the Vim-style shortcuts (Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline).', 1) ON CONFLICT (id) DO UPDATE SET content = 'This is a sample document. You can edit it using the Vim-style shortcuts (Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline).';"
  docker exec contained-postgres psql -U postgres -d my_app_db -c "INSERT INTO document_permissions (document_id, user_id, role) VALUES (1, 1, 'owner') ON CONFLICT DO NOTHING;"
}

# Function to kill processes on a specific port
kill_process_on_port() {
  local port=$1
  if check_port $port; then
    echo "Killing process on port $port..."
    lsof -ti:$port | xargs kill -9
    sleep 1
  fi
}

# Main script starts here
echo "=== Starting Neovim for Writers ==="

# Step 1: Check if Docker is running
check_docker

# Step 2: Start PostgreSQL container
echo "Starting PostgreSQL container..."
cd backend
if docker ps | grep -q contained-postgres; then
  echo "PostgreSQL container is already running."
else
  docker-compose up -d
  if [ $? -ne 0 ]; then
    echo "Failed to start PostgreSQL container. Trying alternative method..."
    docker run -d --name contained-postgres -p 5431:5432 -e POSTGRES_PASSWORD=secret -e POSTGRES_USER=postgres postgres:latest
    if [ $? -ne 0 ]; then
      echo "Failed to start PostgreSQL container using alternative method."
      exit 1
    fi
  fi
fi

# Step 3: Apply database migrations
apply_migrations

# Step 4: Kill any processes that might be using backend/frontend ports
kill_process_on_port 3001
kill_process_on_port 5173

# Step 5: Start backend server
echo "Starting backend server..."
cargo run &
BACKEND_PID=$!
cd ..

# Step 6: Wait for backend to start
echo "Waiting for backend to start..."
attempts=0
max_attempts=10
while ! curl -s http://localhost:3001 >/dev/null 2>&1; do
  attempts=$((attempts+1))
  if [ $attempts -ge $max_attempts ]; then
    echo "Backend failed to start after $max_attempts attempts."
    break
  fi
  sleep 2
done

# Step 7: Start frontend server
echo "Starting frontend server..."
cd frontend
npm run dev -- --port 5175 &
FRONTEND_PID=$!

# Step 8: Wait for frontend to start
echo "Waiting for frontend to start..."
attempts=0
max_attempts=20
while ! curl -s http://localhost:5175 >/dev/null 2>&1; do
  attempts=$((attempts+1))
  if [ $attempts -ge $max_attempts ]; then
    echo "Frontend might not have started properly. Please check the logs above."
    break
  fi
  sleep 2
done

# Print instructions
echo
echo "=== Neovim for Writers is now running! ==="
echo
echo "Access the application:"
echo "- Frontend: http://localhost:5175"
echo "- Backend: http://localhost:3001"
echo
echo "Quick access:"
echo "- Text Editor: http://localhost:5175/document/2"
echo "- Projects: http://localhost:5175/projects"

# Catch Ctrl+C and kill spawned processes
trap "echo 'Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait 