-- Migration Script can be run using the cli argument 'migrate'
-- In psql run \i /path/to/your/migration_script.sql
-- This will wipe the database

DROP TABLE IF EXISTS document_permissions CASCADE;
DROP TABLE IF EXISTS document_projects CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Create projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) DEFAULT 'Untitled Project' NOT NULL,
    description TEXT,
    owner_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) DEFAULT 'Untitled Document' NOT NULL,
    content TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES users(id) ON DELETE CASCADE
);

-- Create junction table for many-to-many relationship
CREATE TABLE document_projects (
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, project_id)
);

-- Create document_permissions table for role-based access
CREATE TABLE document_permissions (
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('viewer', 'editor', 'owner')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id, user_id)
);

-- Create an index for faster lookups
CREATE INDEX idx_document_permissions_user_id ON document_permissions(user_id);

-- Dummy User
INSERT INTO users(name,email,password) 
VALUES('Christian','CFdefence@gmail.com','MyPassword')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users(name,email,password) 
VALUES('Marko','MarkoP@gmail.com','MarkosPassword')
ON CONFLICT (email) DO NOTHING;

-- Create a test document owned by user 1
INSERT INTO documents(id, name, content, user_id)
VALUES(1, 'Test Document', 'Test content', 1)
ON CONFLICT (id) DO NOTHING;

-- Ensure user 1 has owner permission for document 1
INSERT INTO document_permissions(document_id, user_id, role)
VALUES(1, 1, 'owner')
ON CONFLICT (document_id, user_id) DO UPDATE SET role = 'owner';

-- Add project here