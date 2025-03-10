FROM redis:7.2-alpine

USER root

ARG HOST_UID
ARG HOST_GID
ARG HOST_USER
ARG HOST_GROUP

ENV HOST_UID=${HOST_UID} \
    HOST_GID=${HOST_GID} \
    HOST_USER=${HOST_USER} \
    HOST_GROUP=${HOST_GROUP}

# Create the user inside the container
RUN addgroup $HOST_GROUP && \
    adduser -D -H -u $HOST_UID -G $HOST_GROUP $HOST_USER

# Create Redis config directory inside the volume
RUN mkdir -p /redisdata && chown -R $HOST_USER:$HOST_GROUP /redisdata

# Copy a default redis.conf into the volume
COPY conf/redis.conf /redisdata/redis.conf

# Switch to non-root user
USER $HOST_USER

VOLUME /redisdata

EXPOSE 6379

CMD ["redis-server", "/redisdata/redis.conf"]
