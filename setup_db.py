#!/bin/bash

# Variables
DB_NAME="qrdb"
DB_USER="qr_user"
DB_PASSWORD="securepassword"

# Create the PostgreSQL database and user
psql -U postgres <<EOF
-- Create database
CREATE DATABASE $DB_NAME;

-- Create user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER WITH SUPERUSER;

-- Confirm creation
\l
EOF

echo "Database and user created successfully."
