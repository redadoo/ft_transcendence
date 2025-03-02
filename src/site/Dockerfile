FROM python:3.11-alpine3.21

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
    APP_HOME=/home/ft_transcendence \
    GUNICORN_PATH=/home/gunicorn

RUN addgroup -g $HOST_GID $HOST_GROUP && \
    adduser -D -H -u $HOST_UID -G $HOST_GROUP $HOST_USER

RUN mkdir -p $APP_HOME/staticfiles \
    $GUNICORN_PATH/logs \
    $GUNICORN_PATH/run \
    && chown -R $HOST_UID:$HOST_GID $APP_HOME $GUNICORN_PATH

WORKDIR $APP_HOME

COPY --chown=$HOST_UID:$HOST_GID ./config/requirements.txt .


RUN pip install --upgrade pip && \
pip install --no-cache-dir -r requirements.txt

COPY --chown=$HOST_UID:$HOST_GID ./tools/entrypoint.sh .
RUN chmod +x entrypoint.sh

COPY --chown=$HOST_UID:$HOST_GID ./config/gunicorn/dev.py /home/gunicorn/dev.py
COPY --chown=$HOST_UID:$HOST_GID . .

EXPOSE 8000

USER $HOST_USER

ENTRYPOINT ["./entrypoint.sh"]
