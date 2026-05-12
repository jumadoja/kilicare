from .base import *

# ======================
# DEVELOPMENT SETTINGS
# ======================

ENV = "development"
DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# DEVELOPMENT-ONLY: Provide fallback secrets for local development
# These are ONLY for development and validation will reject them in production
if not SECRET_KEY:
    SECRET_KEY = "dev-secret-key-change-in-production"
if not JWT_SECRET_KEY:
    JWT_SECRET_KEY = "dev-jwt-secret-key-change-in-production"

# DEVELOPMENT-ONLY: Provide PostgreSQL fallback for local development
# In production, these MUST be set via environment variables
if not os.getenv("DB_NAME"):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'kilicare_dev',
            'USER': 'postgres',
            'PASSWORD': 'postgres',
            'HOST': 'localhost',
            'PORT': '5432',
            'CONN_MAX_AGE': 600,
            'OPTIONS': {
                'connect_timeout': 10,
                'sslmode': 'disable',  # Disable SSL for local development
            },
        }
    }

# DEVELOPMENT-ONLY: Allow all CORS origins for local development
# This is safe because we're only running on localhost
CORS_ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
CORS_ALLOW_ALL_ORIGINS = True

# DEVELOPMENT-ONLY: Insecure cookie settings for localhost HTTP
# These MUST be overridden to secure values in production
SESSION_COOKIE_SECURE = False  # Allow cookies over HTTP for localhost
CSRF_COOKIE_SECURE = False  # Allow CSRF cookies over HTTP for localhost
SESSION_COOKIE_HTTPONLY = True  # Keep httpOnly for security
CSRF_COOKIE_HTTPONLY = True  # Keep httpOnly for security
SESSION_COOKIE_SAMESITE = 'Lax'  # Lax for localhost
CSRF_COOKIE_SAMESITE = 'Lax'  # Lax for localhost

SIMPLE_JWT = {
    **SIMPLE_JWT,
    'AUTH_COOKIE_SECURE': False,  # Allow cookies over HTTP for localhost
    'AUTH_COOKIE_SAMESITE': 'Lax',  # Lax for localhost
}

# Faster dev caching off
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Simpler email backend (no real emails sent)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Disable Channels/Redis in development for faster startup
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}

# Development fallbacks for Celery (not used in dev)
if not CELERY_BROKER_URL:
    CELERY_BROKER_URL = 'redis://127.0.0.1:6379/0'
if not CELERY_RESULT_BACKEND:
    CELERY_RESULT_BACKEND = 'redis://127.0.0.1:6379/0'

# Disable Celery in development
CELERY_TASK_ALWAYS_EAGER = True