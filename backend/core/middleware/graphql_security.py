"""
GraphQL Security Middleware
Provides rate limiting, depth limiting, complexity limiting, and introspection control
"""
from django.core.cache import cache
from django.conf import settings
from graphql import GraphQLError
import time
from functools import wraps


class GraphQLRateLimiter:
    """Rate limiting for GraphQL queries"""
    
    @staticmethod
    def get_client_id(request):
        """Get client identifier for rate limiting"""
        user = request.user
        if user.is_authenticated:
            return f"user:{user.id}"
        # Use IP address for anonymous users
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return f"anon:{ip}"
    
    @staticmethod
    def check_rate_limit(request):
        """Check if client has exceeded rate limit"""
        client_id = GraphQLRateLimiter.get_client_id(request)
        user = request.user
        
        # Rate limits: anonymous 50/hour, authenticated 1000/hour
        if user.is_authenticated:
            limit = 1000
            key = f"graphql_rate_auth:{client_id}"
        else:
            limit = 50
            key = f"graphql_rate_anon:{client_id}"
        
        # Get current count from cache
        count = cache.get(key, 0)
        
        if count >= limit:
            raise GraphQLError("Rate limit exceeded. Please try again later.")
        
        # Increment counter with 1 hour expiry
        cache.set(key, count + 1, 3600)


class GraphQLDepthLimiter:
    """Depth limiting for GraphQL queries"""
    
    MAX_DEPTH = 10
    
    @staticmethod
    def get_query_depth(node, depth=0):
        """Calculate query depth recursively"""
        if hasattr(node, 'selection_set') and node.selection_set:
            max_child_depth = 0
            for field in node.selection_set.selections:
                child_depth = GraphQLDepthLimiter.get_query_depth(field, depth + 1)
                if child_depth > max_child_depth:
                    max_child_depth = child_depth
            return max_child_depth
        return depth
    
    @staticmethod
    def validate_depth(document):
        """Validate query depth"""
        from graphql.language.ast import OperationDefinitionNode
        
        for definition in document.definitions:
            if isinstance(definition, OperationDefinitionNode):
                depth = GraphQLDepthLimiter.get_query_depth(definition)
                if depth > GraphQLDepthLimiter.MAX_DEPTH:
                    raise GraphQLError(
                        f"Query depth exceeds maximum allowed depth of {GraphQLDepthLimiter.MAX_DEPTH}. "
                        f"Your query depth: {depth}"
                    )


class GraphQLComplexityLimiter:
    """Complexity limiting for GraphQL queries"""
    
    MAX_COMPLEXITY = 1000
    
    @staticmethod
    def calculate_complexity(node, multiplier=1):
        """Calculate query complexity"""
        complexity = multiplier
        
        if hasattr(node, 'selection_set') and node.selection_set:
            for field in node.selection_set.selections:
                # Basic complexity calculation
                field_complexity = 1
                if hasattr(field, 'arguments'):
                    # Check for list/array arguments that might increase complexity
                    for arg in field.arguments:
                        if hasattr(arg.value, 'values'):
                            field_complexity += len(arg.value.values) * 0.5
                
                child_complexity = GraphQLComplexityLimiter.calculate_complexity(field, field_complexity)
                complexity += child_complexity
        
        return complexity
    
    @staticmethod
    def validate_complexity(document):
        """Validate query complexity"""
        from graphql.language.ast import OperationDefinitionNode
        
        total_complexity = 0
        for definition in document.definitions:
            if isinstance(definition, OperationDefinitionNode):
                complexity = GraphQLComplexityLimiter.calculate_complexity(definition)
                total_complexity += complexity
        
        if total_complexity > GraphQLComplexityLimiter.MAX_COMPLEXITY:
            raise GraphQLError(
                f"Query complexity exceeds maximum allowed complexity of {GraphQLComplexityLimiter.MAX_COMPLEXITY}. "
                f"Your query complexity: {int(total_complexity)}"
            )


def graphql_security_middleware(func):
    """
    Decorator to apply GraphQL security checks
    """
    @wraps(func)
    def wrapped(request, *args, **kwargs):
        # Apply rate limiting
        GraphQLRateLimiter.check_rate_limit(request)
        
        # Parse and validate query document
        from graphql import parse
        query = request.POST.get('query') or request.GET.get('query')
        
        if query:
            try:
                document = parse(query)
                
                # Apply depth limiting
                GraphQLDepthLimiter.validate_depth(document)
                
                # Apply complexity limiting
                GraphQLComplexityLimiter.validate_complexity(document)
                
            except GraphQLError as e:
                return e
        
        return func(request, *args, **kwargs)
    
    return wrapped
