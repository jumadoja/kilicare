 
from .base import *

# ======================
# PRODUCTION SETTINGS
# ======================

ENV = "production"
DEBUG = False

# CRITICAL: ALLOWED_HOSTS must be set via environment variable
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")

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
# CORS_ALLOWED_ORIGINS must be set via environment variable
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")

# CSRF trusted origins must match production domains
CSRF_TRUSTED_ORIGINS = os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")

# ======================
# PRODUCTION DATABASE
# ======================
# PostgreSQL with SSL enforced in production
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

# Logging (basic)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
}