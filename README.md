# Neovim for Writers

A modern document editing platform with a Google Drive-like interface for writers, featuring Vim-style keyboard shortcuts.

## IMPORTANT: Using the Application

### Quick Start

1. **Access the text editor directly**:
   ```
   http://localhost:5175/document/2
   ```

2. **For the home page**:
   ```
   http://localhost:5175
   ```

3. **To browse projects**:
   ```
   http://localhost:5175/projects
   ```

4. **Login page**:
   ```
   http://localhost:5175/login
   ```
   
   Use these credentials:
   - Email: `marko61680@gmail.com`
   - Password: `bathroom75`

## Features

- User authentication (login/signup)
- Project management for organizing documents
- Google Drive-like document management interface
- Rich text editor with formatting controls
- Auto-saving functionality
- Vim-style keyboard shortcuts:
  - `Ctrl+B`: Toggle bold text
  - `Ctrl+I`: Toggle italic text
  - `Ctrl+U`: Toggle underline text
  - `Ctrl+Z`: Undo
  - `Ctrl+Shift+Z`: Redo

## Technology Stack

- **Frontend**: Svelte, TypeScript, TailwindCSS
- **Backend**: Rust, Axum web framework
- **Database**: PostgreSQL (in Docker)

## Getting Started

### Prerequisites

- Docker Desktop for PostgreSQL
- Node.js and npm for the frontend
- Rust and Cargo for the backend

### Running the Application

The simplest way to run the application is using our enhanced start script:

```bash
chmod +x start.sh
./start.sh
```

The script will:
1. Check if Docker is running and start it if needed
2. Start the PostgreSQL database in a Docker container
3. Apply all database migrations automatically
4. Create test user accounts for login
5. Start the Rust backend server
6. Start the Svelte frontend development server
7. Provide login information

### Login Credentials

You can use either of these accounts:

- **Test User**
  - Email: `test@example.com`
  - Password: `password123`

- **Marko's Account**
  - Email: `marko61680@gmail.com`
  - Password: `bathroom75`

### Manual Setup (If start.sh fails)

If you need to set up the components manually:

#### 1. Start Docker and PostgreSQL

```bash
# Start Docker Desktop first (manually)

# Start PostgreSQL container
cd backend
docker-compose up -d
```

#### 2. Set up the database

```bash
# Create database if it doesn't exist
docker exec contained-postgres psql -U postgres -c "CREATE DATABASE my_app_db WITH OWNER postgres;"

# Apply migrations
docker cp migrations/01_migration_script.sql contained-postgres:/tmp/
docker exec contained-postgres psql -U postgres -d my_app_db -f /tmp/01_migration_script.sql

docker cp migrations/02_add_projects.sql contained-postgres:/tmp/
docker exec contained-postgres psql -U postgres -d my_app_db -f /tmp/02_add_projects.sql

# Create test users
docker exec contained-postgres psql -U postgres -d my_app_db -c "INSERT INTO users (name, email, password) VALUES ('Test User', 'test@example.com', 'password123') ON CONFLICT (email) DO UPDATE SET password = 'password123';"
docker exec contained-postgres psql -U postgres -d my_app_db -c "INSERT INTO users (name, email, password) VALUES ('Marko', 'marko61680@gmail.com', 'bathroom75') ON CONFLICT (email) DO UPDATE SET password = 'bathroom75';"
```

#### 3. Start the backend server

```bash
# Kill any existing processes (if needed)
lsof -ti:3001 | xargs kill -9

# Start backend
cd backend
cargo run
```

#### 4. Start the frontend server

```bash
# In a new terminal
# Kill any existing processes (if needed)
lsof -ti:5175 | xargs kill -9

# Start frontend
cd frontend
npm run dev -- --port 5175
```

## Troubleshooting

### Common Issues and Solutions

1. **Docker is not running**
   - Start Docker Desktop manually
   - Wait until it's fully loaded before running the start script

2. **Port is already in use**
   - Check if processes are using required ports:
     ```bash
     lsof -i:3001  # Check backend port
     lsof -i:5175  # Check frontend port
     ```
   - Kill existing processes:
     ```bash
     lsof -ti:3001 | xargs kill -9  # Kill backend process
     lsof -ti:5175 | xargs kill -9  # Kill frontend process
     ```

3. **Login doesn't work**
   - Make sure cookies are enabled in your browser
   - Try using the hard-coded test account: marko61680@gmail.com / bathroom75
   - Check browser console for error messages

4. **Database connection errors**
   - Make sure PostgreSQL container is running:
     ```bash
     docker ps | grep contained-postgres
     ```
   - Restart the container if needed:
     ```bash
     docker restart contained-postgres
     ```

5. **Text editor doesn't load**
   - Make sure both frontend and backend are running
   - Try accessing a document directly: http://localhost:5175/document/2

## Project Structure

- `frontend/`: Svelte frontend application
- `backend/`: Rust backend API
- `docs/`: Documentation
- `start.sh`: Script to start all services
- `test_project.sh`: Testing script

## Development

### Frontend Development

The frontend is built with Svelte and located in the `frontend/` directory.

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

The backend is built with Rust and located in the `backend/` directory.

```bash
cd backend
cargo run
```

## License

[MIT License](LICENSE)
