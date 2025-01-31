FROM alpine:3.20.0

RUN apk update && apk upgrade
RUN apk add nginx openssl

RUN mkdir -p /etc/nginx/ssl

RUN openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes \
    -out /etc/nginx/ssl/evocatur.crt \
    -keyout /etc/nginx/ssl/evocatur.key \
    -subj "/C=IT/ST=Rome/L=Rome/O=42 Roma Luiss/OU=evocatur/CN=evocatur"

COPY default.conf /etc/nginx/http.d/default.conf
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]