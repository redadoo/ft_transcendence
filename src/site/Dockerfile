###########
# BUILDER #
###########

# pull official base image
FROM python:3.11-slim-buster AS builder

# set work directory
WORKDIR /app

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc

# lint
RUN pip install --upgrade pip
RUN pip install flake8==6.0.0
COPY . /usr/src/app/
RUN flake8 --ignore=E501,F401 .

# install python dependencies
COPY ./requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements.txt

#########
# FINAL #
#########

# pull official base image
FROM python:3.11-slim-buster

# create directory for the app user
RUN mkdir -p /home/app

# create the app user
RUN addgroup --system app && adduser --system --group app

# create the appropriate directories
ENV HOME=/home/app
ENV APP_HOME=/home/app/ft_transcendence
RUN mkdir $APP_HOME
RUN mkdir $APP_HOME/staticfiles
RUN mkdir $APP_HOME/mediafiles
WORKDIR $APP_HOME

# install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends netcat
RUN apt-get install -y --no-install-recommends curl
COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /usr/src/app/requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache /wheels/*

COPY ./entrypoint.sh .
RUN sed -i 's/\r$//g'  entrypoint.sh
RUN chmod +x entrypoint.sh

# copy project
COPY media/. mediafiles/
COPY --chown=app:app . $APP_HOME


# create the appropriate directories
RUN mkdir -p /var/log/gunicorn
RUN mkdir -p /var/run/gunicorn
RUN chown -R app:app /var/log/gunicorn
RUN chown -R app:app /var/run/gunicorn

# change to the app user
USER app

ENTRYPOINT ["./entrypoint.sh"]