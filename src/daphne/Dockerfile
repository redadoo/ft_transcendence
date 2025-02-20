FROM python:alpine3.21

# Prevent Python from writing pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=ft_transcendence.settings

EXPOSE 9000

# Create evocatur user with correct UID and GID
RUN mkdir -p /home/evocatur/goinfree && \
    adduser -D -H -u 13449 -G 2022_rome evocatur && \
    chown -R evocatur:2022_rome /home/evocatur

ENV HOME=/home/evocatur
ENV APP_HOME=/home/evocatur/goinfree/ft_transcendence
RUN mkdir -p $APP_HOME

WORKDIR $APP_HOME

COPY ./daphne/config/requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY --chown=13449:4222 site/ .

COPY --chown=13449:4222 ./daphne/tools/entrypoint.sh .

RUN chmod +x entrypoint.sh

USER evocatur

ENTRYPOINT ["./entrypoint.sh"]
