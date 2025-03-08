FROM prom/prometheus:v3.1.0

USER root

ARG HOST_UID
ARG HOST_GID
ARG HOST_USER
ARG HOST_GROUP

ENV HOST_UID=${HOST_UID} \
    HOST_GID=${HOST_GID} \
    HOST_USER=${HOST_USER} \
    HOST_GROUP=${HOST_GROUP}

RUN addgroup -g $HOST_GID $HOST_GROUP && \
    adduser -D -H -u $HOST_UID -G $HOST_GROUP $HOST_USER

RUN chown -R $HOST_USER:$HOST_GROUP /prometheus

COPY conf/prometheus.yml /tmp/prometheus.yml 
COPY conf/alerting_rules.yml /tmp/alerting_rules.yml 

USER ${HOST_USER}