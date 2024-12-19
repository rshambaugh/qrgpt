#!/usr/bin/env bash

# Exit on error
set -e

# Adjust host and port if necessary. Default: localhost and port 5432.
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="qrdb"
DB_USER="qr_user"
OUTPUT_FILE="db_schema.sql"

echo "Exporting schema from database '$DB_NAME' as user '$DB_USER'..."

# The `-s` flag dumps only the schema, not the data
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -s "$DB_NAME" > "$OUTPUT_FILE"

echo "Schema exported to $OUTPUT_FILE"

