import os
from celery import Celery

# set default Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("kilicare")

# load settings from Django
app.config_from_object("django.conf:settings", namespace="CELERY")

# auto-discover tasks in installed apps
app.autodiscover_tasks()