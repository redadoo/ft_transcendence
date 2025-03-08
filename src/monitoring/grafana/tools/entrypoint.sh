#!/bin/bash
set -e

(
    echo "Waiting for Grafana to become healthy..."
    until [ "$(curl -s http://localhost:3000/api/health | jq -r .database)" = "ok" ]; do
        echo "Grafana not yet ready, sleeping 2 seconds..."
        sleep 2
    done
    echo "Grafana is up and healthy!"

    echo "Creating service account..."
    SA_RESPONSE=$(curl -s -X POST http://localhost:3000/api/serviceaccounts \
      -u "$GRAFANA_ADMIN_USER:$GRAFANA_ADMIN_PASS" \
      -H "Content-Type: application/json" \
      -d '{
            "name": "grafana",
            "role": "Admin",
            "isDisabled": false
          }')
    
    SA_ID=$(echo "$SA_RESPONSE" | jq -r '.id')
    if [ "$SA_ID" = "null" ] || [ -z "$SA_ID" ]; then
      echo "Failed to create service account! Response: $SA_RESPONSE"
      exit 1
    fi
    echo "Service account created with ID: $SA_ID"

    echo "Creating token for service account..."
    TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/serviceaccounts/"$SA_ID"/tokens \
      -u "$GRAFANA_ADMIN_USER:$GRAFANA_ADMIN_PASS" \
      -H "Content-Type: application/json" \
      -d '{
            "name": "grafana",
            "secondsToLive": 604800
          }')
    
    SERVICE_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.key')
    if [ "$SERVICE_TOKEN" = "null" ] || [ -z "$SERVICE_TOKEN" ]; then
      echo "Failed to obtain service account token! Response: $TOKEN_RESPONSE"
      exit 1
    fi
    echo "Service account token acquired."

    echo "Configuring Prometheus datasource..."
    curl -s -X POST http://localhost:3000/api/datasources \
      -H "Authorization: Bearer $SERVICE_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
            "name": "Prometheus",
            "type": "prometheus",
            "url": "http://prometheus:9090",
            "access": "proxy",
            "isDefault": true
          }'

    echo "Configuring postgres dashboard..."
    curl -X POST http://localhost:3000/api/dashboards/import \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $SERVICE_TOKEN" \
      -d @/usr/local/bin/postgres.json

    echo "Configuring prometheus dashboard..."
    curl -X POST http://localhost:3000/api/dashboards/import \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $SERVICE_TOKEN" \
      -d @/usr/local/bin/prometheus.json

    echo "Configuring nginx dashboard..."
    curl -X POST http://localhost:3000/api/dashboards/import \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $SERVICE_TOKEN" \
      -d @/usr/local/bin/nginx.json

    echo "Configuring django dashboard..."
    curl -X POST http://localhost:3000/api/dashboards/import \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $SERVICE_TOKEN" \
      -d @/usr/local/bin/django.json

    echo "Provisioning completed."
) &

echo "Starting Grafana in foreground..."
exec /run.sh
