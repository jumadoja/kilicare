 
from .base import *

# ======================
# PRODUCTION SETTINGS
# ======================

ENV = "production"
DEBUG = False

# CRITICAL: ALLOWED_HOSTS - Hybrid safe approach for Render deployment
RAW_HOSTS = os.getenv("ALLOWED_HOSTS", "")

ALLOWED_HOSTS = [
    host.strip()
    for host in RAW_HOSTS.split(",")
    if host.strip()
]

# SAFE FALLBACK (IMPORTANT FOR RENDER)
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = [
        "localhost",
        "127.0.0.1",
        ".onrender.com"
    ]

# ======================
# SECURITY HARDENING
# ======================

# SSL/HTTPS enforcement
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Production-grade cookie settings
SESSION_COOKIE_SECURE = True  # Only send cookies over HTTPS
CSRF_COOKIE_SECURE = True  # Only send CSRF cookies over HTTPS
SESSION_COOKIE_HTTPONLY = True  # Prevent JavaScript access to session cookies
CSRF_COOKIE_HTTPONLY = True  # Prevent JavaScript access to CSRF cookie
# CRITICAL: Use 'None' for cross-domain (Vercel → Render)
SESSION_COOKIE_SAMESITE = 'None'  # Allow cross-domain cookies
CSRF_COOKIE_SAMESITE = 'None'  # Allow cross-domain cookies

# HSTS settings (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Additional security headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# CORS: Never allow all origins in production
CORS_ALLOW_ALL_ORIGINS = False
# CORS_ALLOWED_ORIGINS with safe fallback
cors_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
CORS_ALLOWED_ORIGINS = [
    origin.strip() 
    for origin in cors_origins_env.split(",") 
    if origin.strip()
]

# SAFE FALLBACK for CORS
if not CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS = [
        "https://kilicare-hub.vercel.app",
        "https://*.onrender.com"
    ]

# CRITICAL: CSRF trusted origins with safe fallback
csrf_origins_env = os.getenv("CSRF_TRUSTED_ORIGINS", "").strip()
CSRF_TRUSTED_ORIGINS = [
    origin.strip() 
    for origin in csrf_origins_env.split(",") 
    if origin.strip()
]

# SAFE FALLBACK for Render deployment
if not CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = [
        "https://kilicare-1.onrender.com",
        "https://*.onrender.com"
    ]

# ======================
# SESSION CONFIGURATION
# ======================
# Explicit session configuration for production
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_SAVE_EVERY_REQUEST = True
SESSION_COOKIE_DOMAIN = None  # Allow cross-subdomain sessions

# ======================
# PRODUCTION DATABASE
# ======================
# PostgreSQL with SSL enforced in production
if 'default' in DATABASES:
    DATABASES['default'].setdefault('OPTIONS', {})
    DATABASES['default']['OPTIONS']['sslmode'] = 'require'

# ======================
# PRODUCTION CACHING
# ======================
# Ensure Redis is used in production (no fallback)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {
                "max_connections": 100,  # Higher for production
                "retry_on_timeout": True,
            },
        },
        "KEY_PREFIX": "kilicare_prod",
        "TIMEOUT": 300,  # 5 minutes default
    }
}

# GraphQL query caching (60-300 seconds)
GRAPHQL_CACHE_TIMEOUT = int(os.getenv("GRAPHQL_CACHE_TIMEOUT", "300"))

# ======================
# PRODUCTION GRAPHQL SECURITY
# ======================
GRAPHQL_SECURITY = {
    "MAX_QUERY_DEPTH": 10,
    "MAX_COMPLEXITY": 1000,
    "RATE_LIMIT_ANONYMOUS": 50,  # requests per hour
    "RATE_LIMIT_AUTHENTICATED": 1000,  # requests per hour
    "ENABLE_INTROSPECTION": False,  # Disabled in production
    "ENABLE_GRAPHIQL": False,  # Disabled in production
}

# Enhanced logging for debugging admin login issues
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{asctime} [{levelname}] {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "django.csrf": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "django.contrib.auth": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}