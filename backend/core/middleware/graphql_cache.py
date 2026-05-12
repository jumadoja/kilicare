"""
GraphQL Caching Middleware
Caches GraphQL query results based on query + variables
"""
from django.core.cache import cache
from django.conf import settings
import hashlib
import json


def get_cache_key(query, variables):
    """
    Generate a cache key based on query and variables
    """
    # Create a hash of the query and variables
    key_data = {
        'query': query,
        'variables': json.dumps(variables, sort_keys=True) if variables else None
    }
    key_string = json.dumps(key_data, sort_keys=True)
    key_hash = hashlib.md5(key_string.encode()).hexdigest()
    return f"graphql_query:{key_hash}"


def graphql_cache_middleware(func):
    """
    Middleware to cache GraphQL query results
    """
    def wrapped(request, *args, **kwargs):
        # Only cache GET requests (queries, not mutations)
        if request.method != 'GET':
            return func(request, *args, **kwargs)
        
        query = request.GET.get('query')
        variables = request.GET.get('variables')
        
        if not query:
            return func(request, *args, **kwargs)
        
        # Parse variables if provided
        try:
            if variables:
                variables = json.loads(variables)
            else:
                variables = None
        except:
            variables = None
        
        # Check if this is a mutation (mutations should not be cached)
        if 'mutation' in query.lower():
            return func(request, *args, **kwargs)
        
        # Generate cache key
        cache_key = get_cache_key(query, variables)
        
        # Try to get from cache
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Execute the query
        result = func(request, *args, **kwargs)
        
        # Cache the result
        cache_timeout = getattr(settings, 'GRAPHQL_CACHE_TIMEOUT', 300)
        cache.set(cache_key, result, cache_timeout)
        
        return result
    
    return wrapped
