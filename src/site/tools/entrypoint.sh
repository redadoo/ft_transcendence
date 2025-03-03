#!/bin/sh
# Exit on any error
set -e

# Wait for the database to be ready
if [ "$DATABASE_HOST" ]; then
  echo "Waiting for database..."
  while ! nc -z $DATABASE_HOST $DATABASE_PORT; do
    sleep 1
  done
  echo "Database is ready!"
fi

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

echo -e "${YELLOW}Creating bot user if they doesn't exist...${NONE}"
python3 manage.py create_bot_user

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn -c /home/gunicorn/dev.py --capture-output --enable-stdio-inheritance
