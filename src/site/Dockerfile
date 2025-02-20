FROM python:alpine3.21

# Prevent Python from writing pyc files and enable unbuffered output.
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create group 2022_rome with GID 4222 and user evocatur with UID 13449
RUN addgroup -g 4222 2022_rome && \
    adduser -D -H -u 13449 -G 2022_rome evocatur && \
    mkdir -p /home/evocatur && \
    chown -R evocatur:2022_rome /home/evocatur

ENV HOME=/home/evocatur
ENV APP_HOME=/home/evocatur/ft_transcendence
RUN mkdir -p $APP_HOME

WORKDIR $APP_HOME

# Copy requirements file and install dependencies
COPY ./config/requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy entrypoint script
COPY ./tools/entrypoint.sh .

RUN chmod +x entrypoint.sh

# Ensure all application files belong to evocatur
COPY --chown=13449:4222 . $APP_HOME

# Use home directory for logs since /var is not writable in rootless mode
RUN mkdir -p $HOME/logs/gunicorn && \
    mkdir -p $HOME/run/gunicorn && \
    chown -R evocatur:2022_rome $HOME/logs/gunicorn && \
    chown -R evocatur:2022_rome $HOME/run/gunicorn

EXPOSE 8000

USER evocatur

ENTRYPOINT ["./entrypoint.sh"]
# Create group 2022_rome with GID 4222 and user evocatur with UID 13449
RUN addgroup -g 4222 2022_rome && \
    adduser -D -H -u 13449 -G 2022_rome evocatur && \
    chown -R evocatur:2022_rome /data

# Switch to non-root user
USER evocatur