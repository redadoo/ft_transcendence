#!/bin/bash

echo "Waiting for Grafana to become available..."
sleep 5  # Optional delay to allow Grafana to initialize

# Run custom setup (e.g., adding data sources)
bash /home/add_datasource.sh

# Start Grafana (ensure this is executed as the last step)
exec /run.sh
