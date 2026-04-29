from django.core.cache import cache
from django.core.cache.utils import make_template_fragment_key
import re


def cache_get(key, default=None):
    """Get value from cache"""
    return cache.get(key, default)


def cache_set(key, value, timeout=300):
    """Set value in cache with timeout (default 5 minutes)"""
    return cache.set(key, value, timeout)


def cache_delete(key):
    """Delete key from cache"""
    return cache.delete(key)


def cache_clear_pattern(pattern):
    """
    Clear all cache keys matching a pattern
    Note: This requires Redis backend for pattern matching
    """
    try:
        from django.core.cache import caches
        cache_backend = caches['default']
        
        # Try to get Redis client
        if hasattr(cache_backend, 'client'):
            redis_client = cache_backend.client
            keys = redis_client.keys(pattern)
            if keys:
                redis_client.delete(*keys)
                return len(keys)
    except Exception:
        # Fallback: iterate through all keys (not efficient)
        # This is a simple implementation for non-Redis backends
        pass
    
    return 0


def cache_queryset(key, queryset, timeout=300):
    """Cache queryset results"""
    data = list(queryset)
    cache_set(key, data, timeout)
    return data


def invalidate_model_cache(model_name):
    """
    Invalidate all cache keys related to a model
    Example: invalidate_model_cache('users.User')
    """
    pattern = f"*{model_name}*"
    return cache_clear_pattern(pattern)
