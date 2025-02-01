#!/bin/sh
set -e

# Wait for the database to be ready
if [ "$DATABASE_HOST" ]; then
  echo "Waiting for database..."
  while ! nc -z $DATABASE_HOST $DATABASE_PORT; do
    sleep 0.1
  done
  echo "Database is ready!"
fi

daphne ft_transcendence.asgi:application -b 0.0.0.0 -p 9000