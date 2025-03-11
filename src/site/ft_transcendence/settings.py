import os
from pathlib import Path
from dotenv import load_dotenv

# --- Environment Setup ---
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(str(BASE_DIR / "env" / ".env.local"))

# --- SECURITY SETTINGS ---
SECRET_KEY = os.environ.get("SECRET_KEY")
DEBUG = bool(int(os.environ.get("DEBUG", 0)))
ALLOWED_HOSTS = [host.strip() for host in os.getenv('DJANGO_ALLOWED_HOSTS', '').split(',') if host.strip()]

def add_ip_range_to_allowed_hosts(ip_range="10.12", use_https=False):
    """
    Dynamically generates a list of IP addresses for the given range.
    Example: For ip_range="10.12", generates IPs from 10.12.0.0 to 10.12.255.255.
    If use_https is True, prefixes the IP with "https://" and appends port 8080.
    """
    prefix = f"{ip_range}."
    hosts = []
    for i in range(256):
        for j in range(256):
            ip = f"{prefix}{i}.{j}"
            if use_https:
                ip = f"https://{ip}:8080"
            hosts.append(ip)
    return hosts

# Extend ALLOWED_HOSTS with generated IP ranges and remove duplicates.
ALLOWED_HOSTS.extend(add_ip_range_to_allowed_hosts("10.12"))
ALLOWED_HOSTS = list(set(ALLOWED_HOSTS))

# Additional security enhancements.
SECURE_HSTS_SECONDS = 30  # Consider 2_592_000 seconds for production.
SECURE_HSTS_PRELOAD = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# --- STATIC & MEDIA FILES ---
STATIC_URL = os.environ.get("DJANGO_STATIC_URL", "/static/")
STATIC_ROOT = BASE_DIR / os.environ.get("DJANGO_STATIC_ROOT", "static")
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = os.environ.get("DJANGO_MEDIA_URL", "/media/")
MEDIA_ROOT = BASE_DIR / "media"

# --- APPLICATION DEFINITION ---
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

# --- MIDDLEWARE CONFIGURATION ---
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

# --- CONDITIONAL SETTINGS ---
if not DEBUG:
    # Use Redis for production channel layers.
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [("redis", 6379)],
                "capacity": 1500,
                "expiry": 10,
            },
        },
    }
    # Secure cookies.
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # Additional production monitoring.
    INSTALLED_APPS.append('django_prometheus')
    MIDDLEWARE.insert(0, 'django_prometheus.middleware.PrometheusBeforeMiddleware')
    MIDDLEWARE.append('django_prometheus.middleware.PrometheusAfterMiddleware')
else:
    # Use in-memory channel layers during development.
    CHANNEL_LAYERS = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

# --- CONTENT SECURITY POLICY (CSP) ---
CSP_DEFAULT_SRC = ("'self'", "blob:")
CSP_SCRIPT_SRC = ("'self'", "https://cdn.jsdelivr.net", "https://auth.42.fr")
CSP_CONNECT_SRC = ("'self'", "blob:")
CSP_IMG_SRC = ("'self'", "data:")
CSP_MEDIA_SRC = ("'self'", "blob:")
CSP_FONT_SRC = ("'self'", "data:")
CSP_STYLE_SRC = ("'self'",)

# --- CSRF SETTINGS ---
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in os.getenv('DJANGO_CSRF_TRUSTED_ORIGINS', '').split(',') if origin.strip()]
CSRF_TRUSTED_ORIGINS.extend(add_ip_range_to_allowed_hosts("10.12", use_https=True))

# --- REST FRAMEWORK CONFIGURATION ---
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'ft_transcendence.throttles.BurstRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'burst': '20/second',
        'user': '1000/day',
        'anon': '500/day',
    },
}

# --- ASGI CONFIGURATION ---
ASGI_APPLICATION = "ft_transcendence.asgi.application"

# --- DATABASE CONFIGURATION ---
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

# --- AUTHENTICATION SETTINGS ---
AUTH_USER_MODEL = 'website.User'
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- TEMPLATES CONFIGURATION ---
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

# --- ROOT URL & LOCALIZATION ---
ROOT_URLCONF = 'ft_transcendence.urls'
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
