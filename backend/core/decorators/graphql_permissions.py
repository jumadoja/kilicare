"""
GraphQL Permission Decorators
Enforce authentication and role-based access control on GraphQL resolvers
"""
from functools import wraps
from graphql import GraphQLError
from django.contrib.auth.decorators import login_required


def login_required_graphql(func):
    """
    Decorator to require authentication for GraphQL resolvers
    """
    @wraps(func)
    def wrapper(root, info, **kwargs):
        user = info.context.user
        if user.is_anonymous:
            raise GraphQLError("Authentication required")
        return func(root, info, **kwargs)
    return wrapper


def role_required(*allowed_roles):
    """
    Decorator to require specific user roles for GraphQL resolvers
    
    Usage:
        @role_required('ADMIN', 'LOCAL_GUIDE')
        def my_resolver(root, info, **kwargs):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(root, info, **kwargs):
            user = info.context.user
            if user.is_anonymous:
                raise GraphQLError("Authentication required")
            
            if user.role not in allowed_roles:
                raise GraphQLError(
                    f"Permission denied. Required roles: {', '.join(allowed_roles)}"
                )
            return func(root, info, **kwargs)
        return wrapper
    return decorator


def verified_required(func):
    """
    Decorator to require verified user status (for locals)
    """
    @wraps(func)
    def wrapper(root, info, **kwargs):
        user = info.context.user
        if user.is_anonymous:
            raise GraphQLError("Authentication required")
        
        if not user.is_verified:
            raise GraphQLError("Account verification required")
        
        return func(root, info, **kwargs)
    return wrapper


def admin_required(func):
    """
    Decorator to require admin role
    """
    return role_required('ADMIN')(func)


def local_guide_required(func):
    """
    Decorator to require local guide role
    """
    return role_required('LOCAL_GUIDE')(func)


def tourist_required(func):
    """
    Decorator to require tourist role
    """
    return role_required('TOURIST')(func)
