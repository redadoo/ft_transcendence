"""Gunicorn *production* config file"""

import multiprocessing


wsgi_app = "ft_transcendence.wsgi:application"

# Worker settings
workers = multiprocessing.cpu_count() * 2
threads = 2 

# Proxy settings
forwarded_allow_ips = "*"
proxy_allow_ips = "*"

# Server settings
bind = "0.0.0.0:8000"
timeout = 30
graceful_timeout = 20

# Logging
loglevel = "debug"
# accesslog = errorlog = "/home/gunicorn/logs/dev.log"
accesslog = "-"
errorlog = "-"
capture_output = True

# PID file
# pidfile = "/home/gunicorn/logs/dev.pid"
# pidfile = None  # Avoid writing a PID file in a container
daemon = False  # Must be False for Dockerpidfile = "/home/gunicorn/logs/dev.pid"

