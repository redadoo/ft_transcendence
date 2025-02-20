FROM alpine:3.20.0

# Install required packages
RUN apk update && apk upgrade && \
    apk add nginx openssl

# Create group 2022_rome with GID 4222 and user evocatur with UID 13449
RUN addgroup -g 4222 2022_rome && \
    adduser -D -H -u 13449 -G 2022_rome evocatur && \
    mkdir -p /home/evocatur/nginx/ssl /home/evocatur/nginx/conf && \
    chown -R evocatur:2022_rome /home/evocatur/nginx

# Generate SSL certificates in user's home directory (not /etc/nginx/)
RUN openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes \
    -out /home/evocatur/nginx/ssl/evocatur.crt \
    -keyout /home/evocatur/nginx/ssl/evocatur.key \
    -subj "/C=IT/ST=Rome/L=Rome/O=42 Roma Luiss/OU=evocatur/CN=evocatur"

# Copy Nginx configuration to user's home directory
COPY config/default.conf /home/evocatur/nginx/conf/default.conf

# Set Nginx to listen on an unprivileged port (443 → 8080)
EXPOSE 8080

# Switch to non-root user
USER evocatur

# Start Nginx
CMD ["nginx", "-c", "/home/evocatur/nginx/conf/default.conf", "-g", "daemon off;"]
