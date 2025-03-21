# Neovim for Writers Testing Guide

This document provides instructions for testing all components of the Neovim for Writers application, including the database, frontend, backend, APIs, and text editor.

## Prerequisites

- Docker installed for the PostgreSQL database
- Node.js installed for the frontend
- Rust installed for the backend
- A web browser (Chrome, Firefox, Safari, etc.)

## Automated Testing

We've provided an automated test script that verifies the basic functionality of all components:

```bash
# Make it executable if needed
chmod +x test_project.sh

# Run the test script
./test_project.sh
```

The test script will:
1. Start all services (database, backend, frontend)
2. Check if all services are running
3. Test database connectivity
4. Test basic API endpoints (user registration, login, project/document CRUD)
5. Provide guidance for manual testing of the frontend routes and text editor

## Manual Testing Components

### 1. Database Testing

The PostgreSQL database stores users, projects, and documents:

- **Verify the database is running**: `docker ps | grep contained-postgres`
- **Connect to the database**: `docker exec -it contained-postgres psql -U postgres -d my_app_db`
- **Query users table**: `SELECT * FROM users;`
- **Query projects table**: `SELECT * FROM projects;`
- **Query documents table**: `SELECT * FROM documents;`

### 2. Backend API Testing

The Rust backend provides RESTful APIs:

#### API Endpoints to Test

- **Health Check**: `GET http://localhost:3001/api/health`
- **User Registration**: `POST http://localhost:3001/api/users/register`
- **User Login**: `POST http://localhost:3001/api/users/login`
- **User Logout**: `POST http://localhost:3001/api/users/logout`
- **Create Project**: `POST http://localhost:3001/api/projects`
- **List Projects**: `GET http://localhost:3001/api/projects`
- **Get Project**: `GET http://localhost:3001/api/projects/{id}`
- **Create Document**: `POST http://localhost:3001/api/document`
- **Get Document**: `GET http://localhost:3001/api/document/{id}`
- **Update Document**: `PUT http://localhost:3001/api/document/{id}`

You can test these endpoints using tools like `curl`, Postman, or the included test script.

### 3. Frontend Testing

The frontend is built with Svelte and provides a web interface:

#### Routes to Test

- **Home**: http://localhost:5173/
- **Login**: http://localhost:5173/login
- **Signup**: http://localhost:5173/signup
- **Projects**: http://localhost:5173/projects
- **Drive**: http://localhost:5173/drive
- **Document Editor**: http://localhost:5173/document/{id}

#### UI Testing Checklist

1. **Home Page**:
   - Verify the home page loads correctly
   - Check that login and signup links work
   - If authenticated, should redirect to projects

2. **Authentication**:
   - Test user registration with a new email
   - Test login with valid credentials
   - Test login with invalid credentials
   - Test logout functionality

3. **Projects Page**:
   - Verify projects list displays correctly
   - Test project creation functionality
   - Test project navigation

4. **Drive Page**:
   - Verify documents list displays correctly
   - Test grid and list view toggle
   - Test document creation functionality
   - Test document navigation

### 4. Text Editor Testing

The text editor is a core component and should be thoroughly tested:

#### Text Editor Checklist

1. **Basic Functionality**:
   - Create a new document
   - Type text and verify it appears correctly
   - Save the document and verify it persists (reload the page)

2. **Formatting Features**:
   - Test bold formatting (Ctrl+B or toolbar button)
   - Test italic formatting (Ctrl+I or toolbar button)
   - Test underline formatting (Ctrl+U or toolbar button)

3. **History Features**:
   - Test undo functionality (Ctrl+Z)
   - Test redo functionality (Ctrl+Shift+Z)

4. **Autosave**:
   - Make changes and wait for autosave indicator
   - Reload the page and verify changes persist

## Cross-Component Integration Testing

Test the full workflow to ensure all components work together:

1. Register a new user
2. Log in with the new user
3. Create a new project
4. Create a new document within the project
5. Edit the document with the text editor
6. Navigate back to the drive page
7. Verify the document appears in the document list
8. Open the document again and verify your changes were saved

## Troubleshooting

If any component fails to work properly:

1. **Database Issues**:
   - Check if the Docker container is running
   - Verify database credentials in `.env` file
   - Check database logs: `docker logs contained-postgres`

2. **Backend Issues**:
   - Check the backend logs in the terminal
   - Verify the backend can connect to the database
   - Ensure backend is running on port 3001

3. **Frontend Issues**:
   - Check browser console for JavaScript errors
   - Verify the frontend can connect to the backend
   - Ensure frontend is running on port 5173

## Browser Compatibility

Test the application in multiple browsers to ensure compatibility:
- Google Chrome
- Mozilla Firefox
- Safari
- Microsoft Edge

## Performance Testing

For basic performance testing:
1. Create multiple documents and projects
2. Test document loading time for large documents
3. Test responsiveness when working with the text editor on large documents

---

Following this testing guide will help ensure all components of the Neovim for Writers application are functioning correctly. 