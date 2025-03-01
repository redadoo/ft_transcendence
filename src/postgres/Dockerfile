FROM postgres:14.15-alpine

ARG HOST_UID
ARG HOST_GID
ARG HOST_USER
ARG HOST_GROUP

ENV HOST_UID=${HOST_UID} \
    HOST_GID=${HOST_GID} \
    HOST_USER=${HOST_USER} \
    HOST_GROUP=${HOST_GROUP} \
    PGDATA=/home/$HOST_USER/pgdata

RUN addgroup -g $HOST_GID $HOST_GROUP && \
    adduser -D -H -u $HOST_UID -G $HOST_GROUP $HOST_USER &&\
    mkdir -p /home/$HOST_USER/pgdata && \
    chown -R $HOST_USER:$HOST_GROUP /home/$HOST_USER/pgdata

USER $HOST_USER

EXPOSE 5432

CMD ["postgres"]
