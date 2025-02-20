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

# Create a superuser if it doesn’t exist
echo "Creating superuser..."
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username="admin").exists():
    User.objects.create_superuser("admin", "admin@gmail.com", "admin")
    print("Superuser created!")
else:
    print("Superuser already exists.")
EOF

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn -c config/gunicorn/dev.py