FROM grafana/grafana:11.5.1-ubuntu

# Switch to root to install packages
USER root
RUN apt-get update && apt-get install -y jq && rm -rf /var/lib/apt/lists/*

# Copy the custom scripts into the container
COPY tools/add_datasource.sh /home/add_datasource.sh
COPY tools/entrypoint.sh /home/entrypoint.sh
RUN chmod +x /home/add_datasource.sh /home/entrypoint.sh

RUN addgroup grafana

# Ensure the scripts have the correct permissions
RUN chown grafana:grafana /home/add_datasource.sh /home/entrypoint.sh

# Switch back to the grafana user
USER grafana

# Use our custom entrypoint
ENTRYPOINT ["/home/entrypoint.sh"]
CMD ["/run.sh"]  # Ensure Grafana starts
