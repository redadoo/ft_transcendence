
FROM nginxinc/nginx-unprivileged:stable-alpine

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
    adduser -D -H -u $HOST_UID -G $HOST_GROUP $HOST_USER && \
    mkdir -p /home/nginx/ssl && \
    apk add openssl && \
    mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx

RUN openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes \
    -out /home/nginx/ssl/out.crt \
    -keyout /home/nginx/ssl/keyout.key \
    -subj "/C=IT/ST=Rome/L=Rome/O=42 Roma Luiss/OU=$HOST_USER/CN=$HOST_USER"

RUN chmod 644 /home/nginx/ssl/out.crt /home/nginx/ssl/keyout.key
COPY config/default.conf /home/nginx/conf/default.conf

EXPOSE 8080
USER nginx

CMD ["nginx", "-c", "/home/nginx/conf/default.conf", "-g", "daemon off;"]
