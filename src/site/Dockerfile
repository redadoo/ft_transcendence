FROM python:alpine3.21

# Prevent Python from writing pyc files and enable unbuffered output.
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN mkdir -p /home/app && \
    adduser -D -H app && \
    chown -R app:app /home/app

ENV HOME=/home/app
ENV APP_HOME=/home/app/ft_transcendence
RUN mkdir -p $APP_HOME

WORKDIR $APP_HOME

COPY ./config/requirements.txt .

RUN pip install --upgrade pip && \
pip install --no-cache-dir -r requirements.txt

COPY ./tools/entrypoint.sh .

RUN chmod +x entrypoint.sh

COPY --chown=app:app . $APP_HOME

RUN mkdir -p /var/log/gunicorn
RUN mkdir -p /var/run/gunicorn
RUN chown -R app:app /var/log/gunicorn
RUN chown -R app:app /var/run/gunicorn

EXPOSE 8000

ENTRYPOINT ["/home/app/ft_transcendence/entrypoint.sh"]
