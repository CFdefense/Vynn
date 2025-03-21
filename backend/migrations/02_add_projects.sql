-- Migration Script to add projects table if it doesn't exist

-- Check if the projects table exists, if not, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
    ) THEN
        CREATE TABLE projects (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) DEFAULT 'Untitled Project' NOT NULL,
            description TEXT,
            owner_id INT REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        -- If the table exists but needs to be updated with new columns
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'projects' 
            AND column_name = 'description'
        ) THEN
            ALTER TABLE projects ADD COLUMN description TEXT;
        END IF;

        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'projects' 
            AND column_name = 'created_at'
        ) THEN
            ALTER TABLE projects ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
        END IF;

        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'projects' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
        END IF;

        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'projects' 
            AND column_name = 'user_id'
        ) AND NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'projects' 
            AND column_name = 'owner_id'
        ) THEN
            ALTER TABLE projects RENAME COLUMN user_id TO owner_id;
        END IF;
    END IF;
END
$$;

-- Add a test project for demonstration
INSERT INTO projects (name, description, owner_id) 
VALUES('Sample Project', 'This is a sample project for demonstration purposes', 1)
ON CONFLICT DO NOTHING; 