#!/bin/bash
# Exit on any error
set -e

# Wait for the database to be ready
if [ "$DATABASE_HOST" ]; then
  echo "Waiting for database..."
  while ! nc -z $DATABASE_HOST $DATABASE_PORT; do
    sleep 0.1
  done
  echo "Database is ready!"
fi

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the server
exec "$@"
