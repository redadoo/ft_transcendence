FROM python:alpine3.21

USER root

# Prevent Python from writing pyc files and enable unbuffered output.
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apk add curl

# Ensure the home directory exists and set permissions
RUN addgroup -g 4222 2022_rome && \
    adduser -D -H -u 13449 -G 2022_rome evocatur
    
RUN mkdir -p /home/evocatur && \
    chown -R 13449:4222 /home/evocatur

ENV HOME=/home/evocatur
ENV APP_HOME=/home/evocatur/ft_transcendence
RUN mkdir -p $APP_HOME


# Create staticfiles directory and set appropriate permissions
RUN mkdir -p /home/evocatur/ft_transcendence/staticfiles && \
    chown -R 13449:4222 /home/evocatur/ft_transcendence/staticfiles

# Ensure the /home/gunicorn directory exists and has appropriate permissions
RUN mkdir -p /home/evocatur/gunicorn && \
    chown -R 13449:4222 /home/evocatur/gunicorn

WORKDIR $APP_HOME

# Copy requirements file and install dependencies
COPY ./config/requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy entrypoint script
COPY ./tools/entrypoint.sh .

RUN chmod +x entrypoint.sh

# Copy Gunicorn config
COPY ./config/gunicorn/dev.py /home/evocatur/gunicorn/dev.py

# Ensure all application files belong to the user with UID 13449 and GID 4222
COPY --chown=13449:4222 . $APP_HOME

# Use home directory for logs since /var is not writable in rootless mode
RUN mkdir -p $HOME/gunicorn/logs && \
    mkdir -p $HOME/gunicorn/run && \
    chown -R 13449:4222 $HOME/gunicorn/logs && \
    chown -R 13449:4222 $HOME/gunicorn/run

EXPOSE 8000

USER evocatur

ENTRYPOINT ["./entrypoint.sh"]
