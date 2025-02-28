"""Gunicorn *development* config file"""

wsgi_app = "ft_transcendence.wsgi:application"
loglevel = "debug"
forwarded_allow_ips = "*"
workers = 2
bind = "0.0.0.0:8000"
reload = False
accesslog = errorlog = "/home/evocatur/gunicorn/logs/dev.log"
capture_output = True
pidfile = "/home/evocatur/gunicorn/logs/dev.pid"
daemon = False