#!/bin/bash

echo "=== Neovim for Writers System Test ==="
echo

# Test environment variables
export TEST_USERNAME="testuser@example.com"
export TEST_PASSWORD="Password123!"

# Function to check if a service is running
check_service() {
  local service_name=$1
  local url=$2
  local max_attempts=$3
  local attempt=0
  
  echo "Testing $service_name at $url..."
  
  while [ $attempt -lt $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" $url | grep -q "200\|304"; then
      echo "✅ $service_name is running!"
      return 0
    else
      echo "Waiting for $service_name to start (attempt $(($attempt+1))/$max_attempts)..."
      sleep 2
      attempt=$((attempt+1))
    fi
  done
  
  echo "❌ $service_name failed to start after $max_attempts attempts."
  return 1
}

# 1. Start all services
echo "Starting database, backend, and frontend services..."
source ./start.sh &
START_PID=$!

# Give services time to start up
sleep 5

# 2. Check if services are running
echo -e "\n=== Testing Service Availability ==="
# Check if database is running
if docker ps | grep -q "contained-postgres"; then
  echo "✅ PostgreSQL database is running!"
else
  echo "❌ PostgreSQL database is not running. Demo mode will be activated."
fi

# Check if backend API is running
check_service "Backend API" "http://localhost:3001/api/health" 5

# Check if frontend is running
check_service "Frontend" "http://localhost:5173" 5

# 3. Test Database connectivity from Backend
echo -e "\n=== Testing Database Connectivity ==="
curl -s http://localhost:3001/api/health | grep -q "database_connected"
if [ $? -eq 0 ]; then
  echo "✅ Backend can connect to the database!"
else
  echo "❌ Backend cannot connect to the database. Demo mode will be activated."
fi

# 4. Test API endpoints
echo -e "\n=== Testing API Endpoints ==="

# Test registration
echo "Testing user registration..."
REGISTER_RESULT=$(curl -s -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}")

echo "$REGISTER_RESULT" | grep -q "id" && echo "✅ User registration works!" || echo "❌ User registration failed. Demo mode will be activated."

# Test login
echo "Testing user login..."
LOGIN_RESULT=$(curl -s -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}")

echo "$LOGIN_RESULT" | grep -q "token" && echo "✅ User login works!" || echo "❌ User login failed. Demo mode will be activated."

# Extract token for authenticated requests (simplified here; in a real test we'd properly extract the token)
TOKEN=$(echo "$LOGIN_RESULT" | grep -o '"token":"[^"]*' | sed 's/"token":"//')

# Test project creation
echo "Testing project creation..."
PROJECT_RESULT=$(curl -s -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Test Project\",\"description\":\"A test project\"}")

PROJECT_ID=$(echo "$PROJECT_RESULT" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo "$PROJECT_RESULT" | grep -q "id" && echo "✅ Project creation works! (Project ID: $PROJECT_ID)" || echo "❌ Project creation failed. Demo mode will be activated."

# Test document creation
echo "Testing document creation..."
DOC_RESULT=$(curl -s -X POST http://localhost:3001/api/document \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Test Document\",\"content\":\"This is test content\",\"project_id\":$PROJECT_ID}")

DOC_ID=$(echo "$DOC_RESULT" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo "$DOC_RESULT" | grep -q "id" && echo "✅ Document creation works! (Document ID: $DOC_ID)" || echo "❌ Document creation failed. Demo mode will be activated."

# Test document retrieval
echo "Testing document retrieval..."
RETRIEVE_RESULT=$(curl -s -X GET http://localhost:3001/api/document/$DOC_ID \
  -H "Authorization: Bearer $TOKEN")

echo "$RETRIEVE_RESULT" | grep -q "content" && echo "✅ Document retrieval works!" || echo "❌ Document retrieval failed. Demo mode will be activated."

# Test document update
echo "Testing document update..."
UPDATE_RESULT=$(curl -s -X PUT http://localhost:3001/api/document/$DOC_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"content\":\"Updated test content\"}")

echo "$UPDATE_RESULT" | grep -q "updated_at" && echo "✅ Document update works!" || echo "❌ Document update failed. Demo mode will be activated."

# 5. Test frontend routing
echo -e "\n=== Testing Frontend Routing ==="
echo "Note: Manual verification required for frontend routes."
echo "Please manually verify these URLs in your browser:"
echo "- Home page: http://localhost:5173/"
echo "- Login page: http://localhost:5173/login"
echo "- Drive page: http://localhost:5173/drive"
echo "- Projects page: http://localhost:5173/projects"
echo "- Document editor: http://localhost:5173/document/1?newDoc=true&name=TestDoc"

# 6. Test text editor capabilities
echo -e "\n=== Testing Text Editor ==="
echo "Note: Manual verification required for text editor functionality."
echo "Please manually verify these features in the document editor:"
echo "- Basic typing/editing"
echo "- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)"
echo "- Undo/Redo functionality (Ctrl+Z, Ctrl+Shift+Z)"
echo "- Autosave functionality"

# 7. Test demo mode
echo -e "\n=== Testing Demo Mode ==="
echo "To force demo mode (if the backend is working):"
echo "1. Stop the backend: kill \$(lsof -ti:3001)"
echo "2. Navigate to any page requiring authentication"
echo "3. The application should switch to demo mode and show sample data"
echo "4. You can still create projects and documents in demo mode"
echo "5. To exit demo mode, restart the backend and refresh the page"

# Report summary
echo -e "\n=== Test Summary ==="
echo "Automated tests complete. Please manually verify frontend and text editor functionality."
echo "If any backend tests failed, the application will automatically switch to demo mode."
echo "To access the application, navigate to: http://localhost:5173"
echo "Login with:"
echo "- Email: $TEST_USERNAME"
echo "- Password: $TEST_PASSWORD"
echo "Or use the hardcoded test account:"
echo "- Email: marko61680@gmail.com"
echo "- Password: bathroom75"

# Cleanup
echo -e "\n=== Cleanup ==="
echo "Press Ctrl+C to stop the services when done testing."
wait $START_PID 