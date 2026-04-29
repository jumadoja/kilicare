from __future__ import absolute_import, unicode_literals

# Hii itahakikisha app inawaka kila Django inapoanza
from .celery import app as celery_app

__all__ = ('celery_app',)