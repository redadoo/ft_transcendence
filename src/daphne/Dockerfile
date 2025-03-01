FROM python:alpine3.21

ARG HOST_UID
ARG HOST_GID
ARG HOST_USER
ARG HOST_GROUP

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST_UID=${HOST_UID} \
    HOST_GID=${HOST_GID} \
    HOST_USER=${HOST_USER} \
    HOST_GROUP=${HOST_GROUP} \
    HOME=/home/$HOST_USER \
    APP_HOME=/home/$HOST_USER/ft_transcendence\
    DJANGO_SETTINGS_MODULE=ft_transcendence.settings


RUN addgroup -g $HOST_GID $HOST_GROUP && \
    adduser -D -H -u $HOST_UID -G $HOST_GROUP $HOST_USER && \
    mkdir -p $APP_HOME

WORKDIR $APP_HOME

COPY ./daphne/config/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY --chown=$HOST_UID:$HOST_GID site/ .
COPY --chown=$HOST_UID:$HOST_GID ./daphne/tools/entrypoint.sh .
RUN chmod +x entrypoint.sh

USER $HOST_USER
EXPOSE 9000

ENTRYPOINT ["./entrypoint.sh"]
