FROM prometheuscommunity/postgres-exporter:v0.16.0

# Create group 2022_rome with GID 4222 and user evocatur with UID 13449
RUN addgroup -g 4222 2022_rome && \
    adduser -D -H -u 13449 -G 2022_rome evocatur && \
    chown -R evocatur:2022_rome /data

# # Switch to non-root user
# USER evocatur