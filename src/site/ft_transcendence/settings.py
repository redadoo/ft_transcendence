import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, "env/.env.local"))

# SECURITY SETTINGS
SECRET_KEY = os.environ.get("SECRET_KEY")
DEBUG = bool(int(os.environ.get("DEBUG", 0)))
ALLOWED_HOSTS = [host.strip() for host in os.getenv('DJANGO_ALLOWED_HOSTS', '').split(',')]


def add_ip_range_to_allowed_hosts(ip_range="10.12"):
    """ Adds IP range like 10.12.*.* to the ALLOWED_HOSTS dynamically """
    ip_base = f"{ip_range}."
    allowed_ips = [f"{ip_base}{i}" for i in range(256)]
    return allowed_ips

ALLOWED_HOSTS.extend(add_ip_range_to_allowed_hosts("10.12"))
ALLOWED_HOSTS = list(set(ALLOWED_HOSTS)) 

# Security enhancements
SECURE_HSTS_SECONDS = 30  # 2_592_000
SECURE_HSTS_PRELOAD = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

if not DEBUG:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [("redis", 6379)]},
        },
    }
    # Secure cookies
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# STATIC AND MEDIA FILES
STATIC_URL = os.environ.get("DJANGO_STATIC_URL", "/static/")
STATIC_ROOT = BASE_DIR / os.environ.get("DJANGO_STATIC_ROOT", "static")
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = os.environ.get("DJANGO_MEDIA_URL", "/media/")
MEDIA_ROOT = BASE_DIR / "media"

# Application definition
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'authentication',
    'social',
    'pong',
    'liarsbar',
    'website',
]

# Middleware configuration
MIDDLEWARE = [
    "ft_transcendence.middleware.DatabaseExceptionMiddleware",
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    "csp.middleware.CSPMiddleware",
]

CSP_DEFAULT_SRC = ("'self'", "blob:")
CSP_SCRIPT_SRC = ("'self'","https://cdn.jsdelivr.net", "https://auth.42.fr")
CSP_CONNECT_SRC = ("'self'", "blob:")
CSP_IMG_SRC = ("'self'", "data:")
CSP_MEDIA_SRC = ("'self'", "blob:")
CSP_FONT_SRC = ("'self'", "data:")
CSP_STYLE_SRC = ("'self'")

# CSRF SETTINGS
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_TRUSTED_ORIGINS = [
    "https://transcendence", "https://localhost", "http://localhost:8000", "http://10.12.8.3:8000", 
    "https://10.12.8.3:8000", "http://10.12.8.3", "https://10.12.8.3"
]

# CHANNEL LAYERS CONFIGURATION
CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
}

# REST FRAMEWORK CONFIGURATION
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'ft_transcendence.throttles.BurstRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'burst': '20/second',
        'user': '2000/day',
        'anon': '2000/day'
    }
}

# ASGI CONFIGURATION
ASGI_APPLICATION = "ft_transcendence.asgi.application"

# DATABASE CONFIGURATION
DATABASES = {
    "default": {
        "ENGINE": os.environ.get("DATABASE_ENGINE", "django.db.backends.sqlite3"),
        "NAME": os.environ.get("DATABASE_NAME", BASE_DIR / "db.sqlite3"),
        "USER": os.environ.get("DATABASE_USER", "user"),
        "PASSWORD": os.environ.get("DATABASE_PASSWORD", "password"),
        "HOST": os.environ.get("DATABASE_HOST", "localhost"),
        "PORT": os.environ.get("DATABASE_PORT", "5432"),
    }
}

# AUTHENTICATION SETTINGS
AUTH_USER_MODEL = 'website.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# TEMPLATES CONFIGURATION
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ROOT URL CONFIGURATION
ROOT_URLCONF = 'ft_transcendence.urls'

# LOCALIZATION SETTINGS
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
