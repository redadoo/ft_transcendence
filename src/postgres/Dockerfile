FROM postgres:14.15-alpine

# Create group 2022_rome with GID 4222 and user evocatur with UID 13449
RUN addgroup -g 4222 2022_rome && \
    adduser -D -H -u 13449 -G 2022_rome evocatur && \
    mkdir -p /home/evocatur/pgdata && \
    chown -R evocatur:2022_rome /home/evocatur/pgdata

# Set environment variables to use custom data directory
ENV PGDATA=/home/evocatur/pgdata

# Switch to non-root user
USER evocatur

EXPOSE 5432

CMD ["postgres"]
