FROM python:alpine3.21

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=ft_transcendence.settings

EXPOSE 9000

RUN mkdir -p /home/app && \
    adduser -D -H daphne && \
    chown -R daphne:daphne /home/app

ENV HOME=/home/app
ENV APP_HOME=/home/app/ft_transcendence
RUN mkdir -p $APP_HOME

WORKDIR $APP_HOME

COPY ./daphne/config/requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY site/ .

COPY ./daphne/tools/entrypoint.sh .

RUN chmod +x entrypoint.sh

USER daphne

ENTRYPOINT ["/home/app/ft_transcendence/entrypoint.sh"]
