"""
Base settings for Kilicare Backend (CLEAN ARCHITECTURE CORE)
"""

from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured

load_dotenv()

# ======================
# BASE DIRECTORY
# ======================
BASE_DIR = Path(__file__).resolve().parent.parent.parent


# ======================
# ENVIRONMENT VARIABLES
# ======================
# SECURITY: Load secrets with development fallbacks (overridden in dev.py)
# Production validation will reject insecure defaults
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")


# ======================
# DEBUG CONTROL (handled in dev/prod)
# ======================
DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() == "true"

# SECURITY: Enforce DEBUG=False in production
ENV = os.getenv("ENV", "development").lower()
if ENV == "production" and DEBUG:
    raise ImproperlyConfigured(
        "CRITICAL: DEBUG=True is not allowed in production environment. "
        "Set DJANGO_DEBUG=false or ENV=development."
    )


# ======================
# ALLOWED HOSTS (override in dev/prod)
# ======================
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")


# ======================
# INSTALLED APPS
# ======================
INSTALLED_APPS = [
    # Core Django
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third Party
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    'channels',
    'graphene_django',
    'graphql_jwt',
    'django_celery_beat',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',

    # Local Apps (clean modular structure)
    'apps.users',
    'apps.ai',
    'apps.messaging',
    'apps.experiences',
    'apps.kilicaremoments',
    'apps.tips',
    'apps.passport',
    'apps.sos',
    'apps.adminpanel',
]


# ======================
# MIDDLEWARE
# ======================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# ======================
# URL CONFIG
# ======================
ROOT_URLCONF = 'config.urls'


# ======================
# TEMPLATES
# ======================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.kilicare.asgi.application'


# ======================
# DATABASE (POSTGRESQL ONLY - NO SQLITE FALLBACK)
# ======================
# CRITICAL: PostgreSQL is required for production. This fails fast if not configured.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv("DB_NAME"),
        'USER': os.getenv("DB_USER"),
        'PASSWORD': os.getenv("DB_PASSWORD"),
        'HOST': os.getenv("DB_HOST"),
        'PORT': os.getenv("DB_PORT", "5432"),
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'connect_timeout': 10,
            'sslmode': os.getenv("DB_SSLMODE", "prefer"),  # Changed from 'require' to 'prefer' for local dev
        },
    }
}

# Validate PostgreSQL configuration at startup
if not all([os.getenv("DB_NAME"), os.getenv("DB_USER"), os.getenv("DB_PASSWORD"), os.getenv("DB_HOST")]):
    raise ImproperlyConfigured(
        "CRITICAL: PostgreSQL is required. Please set DB_NAME, DB_USER, DB_PASSWORD, and DB_HOST environment variables. "
        "SQLite is not supported."
    )


# ======================
# AUTH
# ======================
AUTH_USER_MODEL = "users.User"


# ======================
# DRF CONFIG
# ======================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'register': '5/hour',  # Limit registration attempts
        'login': '10/hour',  # Limit login attempts
        'forgot_password': '3/hour',  # Limit password reset requests
        'reset_password': '5/hour',  # Limit password reset attempts
    }
}


# ======================
# JWT CONFIG
# ======================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'SIGNING_KEY': SECRET_KEY,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'BLACKLIST_AFTER_ROTATION': False,
    'ROTATE_REFRESH_TOKENS': False,
    # Cookie-based authentication settings
    'AUTH_COOKIE': 'access_token',
    'REFRESH_COOKIE': 'refresh_token',
    'AUTH_COOKIE_HTTPONLY': True,
    'AUTH_COOKIE_SECURE': True,  # Overridden in dev.py for localhost
    'AUTH_COOKIE_SAMESITE': 'None',  # Critical for cross-domain (Vercel ↔ Render)
    'AUTH_COOKIE_PATH': '/',
}

# ======================
# PRODUCTION LOGGING CONFIGURATION
# ======================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    
    # Formatters for clean production logging
    'formatters': {
        'verbose': {
            'format': '{asctime} [{levelname}] {name}: {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname}: {message}',
            'style': '{',
        },
        'structured': {
            'format': '{asctime}|{levelname}|{name}|{message}',
            'style': '{',
        },
    },
    
    # Handlers for different log outputs
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'console_verbose': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': str(BASE_DIR / 'logs' / 'django.log'),
            'formatter': 'structured',
            'encoding': 'utf-8',
        },
    },
    
    # Logger configurations - SILENCE NOISE, PRESERVE SIGNALS
    'loggers': {
        # === SILENCED NOISY LOGGERS ===
        'django.db.backends': {
            'handlers': [],
            'level': 'WARNING',  # Only show DB errors, no queries
            'propagate': False,
        },
        'django.server': {
            'handlers': [],
            'level': 'WARNING',  # Only show server errors, no HTTP requests
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',  # Only show request errors (500s)
            'propagate': False,
        },
        'channels': {
            'handlers': [],
            'level': 'WARNING',  # Only show channel errors, no connection spam
            'propagate': False,
        },
        'channels.server': {
            'handlers': [],
            'level': 'WARNING',  # Silence WebSocket connection logs
            'propagate': False,
        },
        'daphne': {
            'handlers': [],
            'level': 'WARNING',  # Silence Daphne HTTP server logs
            'propagate': False,
        },
        'rest_framework': {
            'handlers': [],
            'level': 'WARNING',  # Only show DRF errors, no debug API logs
            'propagate': False,
        },
        
        # === CRITICAL AUTH & SECURITY LOGGERS ===
        'django.contrib.auth': {
            'handlers': ['console_verbose'],
            'level': 'WARNING',  # Show auth failures, login attempts
            'propagate': False,
        },
        'apps.users': {
            'handlers': ['console_verbose'],
            'level': 'WARNING',  # Show user auth issues, registration problems
            'propagate': False,
        },
        'jwt': {
            'handlers': ['console_verbose'],
            'level': 'WARNING',  # Show JWT token issues, blacklist errors
            'propagate': False,
        },
        
        # === APPLICATION LOGGERS ===
        'apps': {
            'handlers': ['console'],
            'level': 'INFO',  # Show app-level info and errors
            'propagate': False,
        },
        
        # === ROOT LOGGER (CATCH-ALL) ===
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',  # Only show Django warnings and errors
            'propagate': False,
        },
        'root': {
            'handlers': ['console'],
            'level': 'WARNING',  # Catch-all for uncategorized logs
        },
    },
    
    # Root configuration
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
}

# Application logger for structured logging
import logging
logger = logging.getLogger('kilicare')

# Structured logging helper functions (production-ready)
def log_auth_event(event_type: str, user_id=None, details=None):
    """Structured authentication event logging"""
    details_str = f" | {details}" if details else ""
    user_str = f" | User: {user_id}" if user_id else ""
    logger.info(f"AUTH_EVENT: {event_type}{user_str}{details_str}")

def log_security_event(event_type: str, severity: str, details=None):
    """Structured security event logging"""
    details_str = f" | {details}" if details else ""
    logger.warning(f"SECURITY_EVENT: {event_type} | {severity}{details_str}")


# ======================
# RATE LIMITING
# ======================
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'register': '5/hour',  # Limit registration attempts
        'login': '10/hour',  # Limit login attempts
        'forgot_password': '3/hour',  # Limit password reset requests
        'reset_password': '5/hour',  # Limit password reset attempts
    }
}


# ======================
# CHANNELS (REALTIME)
# ======================
# Redis URL for channels (can be overridden)
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/0')
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        },
    },
}


# ======================
# CACHING (Redis-based)
# ======================
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {
                "max_connections": 50,
                "retry_on_timeout": True,
            },
        },
        "KEY_PREFIX": "kilicare",
        "TIMEOUT": 300,  # 5 minutes default
    }
}

# GraphQL query caching (60-300 seconds)
GRAPHQL_CACHE_TIMEOUT = int(os.getenv("GRAPHQL_CACHE_TIMEOUT", "300"))


# ======================
# CELERY (ASYNC TASKS)
# ======================
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Nairobi'


# ======================
# CORS
# ======================
# Production origins (can be overridden via env var)
cors_allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
CORS_ALLOWED_ORIGINS = cors_allowed_origins.split(",") if cors_allowed_origins else []
CORS_ALLOW_ALL_ORIGINS = False  # SECURITY: Never allow all origins
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_EXPOSE_HEADERS = ['Content-Type', 'Authorization']

# CSRF
# ======================
csrf_trusted_origins = os.getenv("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = csrf_trusted_origins.split(",") if csrf_trusted_origins else []

# Cookie Settings (Production-safe defaults - overridden in dev.py for localhost)
# ======================
SESSION_COOKIE_SECURE = True  # Only send cookies over HTTPS (overridden in dev.py)
CSRF_COOKIE_SECURE = True  # Only send CSRF cookies over HTTPS (overridden in dev.py)
SESSION_COOKIE_HTTPONLY = True  # Prevent JavaScript access to session cookie
CSRF_COOKIE_HTTPONLY = True  # Prevent JavaScript access to CSRF cookie
SESSION_COOKIE_SAMESITE = 'None'  # Cross-domain support (overridden in dev.py)
CSRF_COOKIE_SAMESITE = 'None'  # Cross-domain support (overridden in dev.py)


# ======================
# PASSWORD VALIDATION
# ======================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
    {'NAME': 'apps.users.validators.ComplexityValidator'},
]


# ======================
# INTERNATIONALIZATION
# ======================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True


# ======================
# STATIC / MEDIA
# ======================
STATIC_URL = '/static/'

# Destination for collectstatic (admin + project)
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / "media"


# ======================
# DEFAULT AUTO FIELD
# ======================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ======================
# GRAPHQL
# ======================
GRAPHENE = {
    "SCHEMA": "config.schema.schema",
    "MIDDLEWARE": [
        "graphql_jwt.middleware.JSONWebTokenMiddleware",
    ],
}

# GraphQL Security Settings
GRAPHQL_SECURITY = {
    "MAX_QUERY_DEPTH": 10,
    "MAX_COMPLEXITY": 1000,
    "RATE_LIMIT_ANONYMOUS": 50,  # requests per hour
    "RATE_LIMIT_AUTHENTICATED": 1000,  # requests per hour
    "ENABLE_INTROSPECTION": DEBUG,  # Only in development
    "ENABLE_GRAPHIQL": DEBUG,  # Only in development
}


# ======================
# EMAIL
# ======================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


# ======================
# GROQ AI CONFIGURATION
# ======================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_TEXT_MODEL = "llama-3.1-8b-instant"
GROQ_VISION_MODEL = "llama-3.2-90b-vision-preview"


# ======================
# DRF SPECTACULAR (OpenAPI/Swagger)
# ======================
SPECTACULAR_SETTINGS = {
    'TITLE': 'Kilicare API',
    'DESCRIPTION': 'API documentation for Kilicare Tourism Platform',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': '/api',
    'COMPONENT_SPLIT_REQUEST': True,
    'COMPONENT_NO_READ_ONLY_REQUIRED': True,
}


# ======================
# STARTUP VALIDATION
# ======================
# Validate critical configuration at startup (after all settings are loaded)
# This ensures production-safe defaults and fails fast on misconfiguration
from .validation import validate_production_config
validate_production_config()
# ======================
# STARTUP VALIDATION
# ======================
# Validate critical configuration at startup (after all settings are loaded)
# This ensures production-safe defaults and fails fast on misconfiguration
from .validation import validate_production_config
validate_production_config()