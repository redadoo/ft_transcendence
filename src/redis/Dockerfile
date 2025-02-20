FROM redis:7.2-alpine

# Create evocatur user and set correct permissions
RUN adduser -D -H -u 13449 -G 2022_rome evocatur && \
    chown -R evocatur:2022_rome /data

# Switch to non-root user
USER evocatur

EXPOSE 6379

CMD ["redis-server"]
