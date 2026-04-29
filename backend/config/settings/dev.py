from .base import *

# ======================
# DEVELOPMENT SETTINGS
# ======================

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

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

# Disable Celery in development
CELERY_TASK_ALWAYS_EAGER = True