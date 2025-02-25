#!/bin/bash

# Define Grafana URL and credentials
GRAFANA_URL="http://localhost:3000"
ADMIN_USER="admin"
ADMIN_PASSWORD="secret"

# JSON payload for the Prometheus data source
DATA_SOURCE_JSON='{
  "name": "Prometheus",
  "type": "prometheus",
  "access": "proxy",
  "url": "http://prometheus:9090",
  "isDefault": true
}'

# Optional pause to ensure stability
sleep 5

# Log in to Grafana to obtain an API token
API_TOKEN=$(curl -s -X POST "$GRAFANA_URL/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"user\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASSWORD\"}" | jq -r '.authToken')

# Add the data source using the Grafana API
curl -X POST "$GRAFANA_URL/api/datasources" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DATA_SOURCE_JSON"


curl -X POST "http://localhost:3000/api/dashboards/db" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "dashboard": {
          "id": 3662,
          "uid": "3662",
          "title": "Updated Dashboard Title",
          "tags": ["custom", "example"],
          "timezone": "browser",
          "rows": [
            {
              "columns": [
                {
                  "panels": [
                    {
                      "type": "graph",
                      "title": "Updated Graph Panel",
                      "targets": [
                        {
                          "expr": "http_requests_total",
                          "legendFormat": "{{method}}",
                          "refId": "A"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        "overwrite": true
      }'

