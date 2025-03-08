#!/bin/bash
set -e

(
  echo "Waiting for Grafana to become healthy..."
  until [ "$(curl -s http://localhost:3000/api/health | jq -r .database)" = "ok" ]; do
      echo "Grafana not yet ready, sleeping 2 seconds..."
      sleep 2
  done
  echo "Grafana is up and healthy!"

  # --------------------------------------------------
  # 1. Provision Datasource & Dashboards Using Admin Account
  # --------------------------------------------------
  echo "Configuring Prometheus datasource..."
  curl -s -X POST http://localhost:3000/api/datasources \
      -u "$GRAFANA_ADMIN_USER:$GRAFANA_ADMIN_PASS" \
      -H "Content-Type: application/json" \
      -d '{
            "name": "Prometheus",
            "type": "prometheus",
            "url": "http://prometheus:9090",
            "access": "proxy",
            "isDefault": true
          }'

  echo "Importing postgres dashboard..."
  curl -s -X POST http://localhost:3000/api/dashboards/import \
      -u "$GRAFANA_ADMIN_USER:$GRAFANA_ADMIN_PASS" \
      -H "Content-Type: application/json" \
      -d @/usr/local/bin/postgres.json

  echo "Importing prometheus dashboard..."
  curl -s -X POST http://localhost:3000/api/dashboards/import \
      -u "$GRAFANA_ADMIN_USER:$GRAFANA_ADMIN_PASS" \
      -H "Content-Type: application/json" \
      -d @/usr/local/bin/prometheus.json

  echo "Importing nginx dashboard..."
  curl -s -X POST http://localhost:3000/api/dashboards/import \
      -u "$GRAFANA_ADMIN_USER:$GRAFANA_ADMIN_PASS" \
      -H "Content-Type: application/json" \
      -d @/usr/local/bin/nginx.json

  echo "Importing django dashboard..."
  curl -s -X POST http://localhost:3000/api/dashboards/import \
      -u "$GRAFANA_ADMIN_USER:$GRAFANA_ADMIN_PASS" \
      -H "Content-Type: application/json" \
      -d @/usr/local/bin/django.json

  echo "Provisioning completed using admin account."

  # --------------------------------------------------
  # 2. Create a Viewer Account for Ongoing Access
  # --------------------------------------------------
  echo "Creating viewer account..."
  curl -s -X POST http://localhost:3000/api/admin/users \
      -u "$GRAFANA_ADMIN_USER:$GRAFANA_ADMIN_PASS" \
      -H "Content-Type: application/json" \
      -d '{
            "name": "'"${VIEWER_USER}"'",
            "email": "'"${VIEWER_EMAIL}"'",
            "login": "'"${VIEWER_USER}"'",
            "password": "'"${VIEWER_PASS}"'"
          }'
  echo "Viewer account created."

  # --------------------------------------------------
  # 3. Delete the Admin Account
  # --------------------------------------------------
  echo "Retrieving admin account ID..."
  ADMIN_ID=$(curl -s -u "$GRAFANA_ADMIN_USER:$GRAFANA_ADMIN_PASS" http://localhost:3000/api/users | jq -r '.[] | select(.login=="admin") | .id')
  if [ -z "$ADMIN_ID" ] || [ "$ADMIN_ID" = "null" ]; then
    echo "Admin account not found or already deleted."
  else
    echo "Deleting admin account (ID: $ADMIN_ID)..."
    curl -s -X DELETE http://localhost:3000/api/admin/users/$ADMIN_ID \
         -u "$GRAFANA_ADMIN_USER:$GRAFANA_ADMIN_PASS"
    echo "Admin account deleted."
  fi

  echo "Switching access to viewer account. Use the viewer credentials for future logins."
) &

echo "Starting Grafana in foreground..."
exec /run.sh
