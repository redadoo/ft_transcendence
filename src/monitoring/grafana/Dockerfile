FROM grafana/grafana:11.5.2-ubuntu

USER root

ARG HOST_UID
ARG HOST_GID
ARG HOST_USER
ARG HOST_GROUP

ENV HOST_UID=${HOST_UID} \
    HOST_GID=${HOST_GID} \
    HOST_USER=${HOST_USER} \
    HOST_GROUP=${HOST_GROUP}

RUN groupadd -g $HOST_GID $HOST_GROUP && \
    useradd -m -u $HOST_UID -g $HOST_GROUP $HOST_USER

RUN apt update && apt install -y jq curl && rm -rf /var/lib/apt/lists/*

COPY tools/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY conf/15489_rev2.json /usr/local/bin/15489_rev2.json

RUN chmod +x /usr/local/bin/entrypoint.sh
RUN chmod 644 /usr/local/bin/15489_rev2.json

USER $HOST_USER

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["/run.sh"]
