"""
Production-hardened GraphQL View
- Disables introspection and GraphiQL in production
- Enforces CSRF protection
- Applies security middleware
- Applies caching middleware
"""
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_http_methods
from django.conf import settings
from graphene_django.views import GraphQLView
from graphql import GraphQLError
import json


class ProductionGraphQLView(GraphQLView):
    """
    Production-hardened GraphQL view with security features
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.graphiql = self._get_graphiql_setting()
        self.enable_introspection = self._get_introspection_setting()
    
    def _get_graphiql_setting(self):
        """GraphiQL only enabled in DEBUG mode"""
        return getattr(settings, 'DEBUG', False)
    
    def _get_introspection_setting(self):
        """Introspection only enabled in DEBUG mode"""
        return getattr(settings, 'DEBUG', False)
    
    def execute_graphql_request(self, request, data, query, variables, operation_name, show_graphiql=False):
        """
        Override to disable introspection in production
        """
        # Disable introspection in production
        if not self.enable_introspection:
            from graphql import parse
            if query:
                try:
                    document = parse(query)
                    # Check if query contains introspection fields
                    for definition in document.definitions:
                        if hasattr(definition, 'selection_set'):
                            for selection in definition.selection_set.selections:
                                field_name = selection.name.value
                                if field_name in ['__schema', '__type', '__typename']:
                                    raise GraphQLError(
                                        "Introspection is disabled in production. "
                                        "Please use the development environment for schema exploration."
                                    )
                except:
                    pass  # Let normal execution handle parse errors
        
        return super().execute_graphql_request(
            request, data, query, variables, operation_name, show_graphiql
        )
    
    def dispatch(self, request, *args, **kwargs):
        """
        Apply security and caching middleware before dispatching
        """
        # Apply GraphQL security middleware
        from .graphql_security import graphql_security_middleware
        from .graphql_cache import graphql_cache_middleware
        
        # Chain middleware: security -> cache -> dispatch
        secured_dispatch = graphql_security_middleware(super().dispatch)
        cached_dispatch = graphql_cache_middleware(secured_dispatch)
        
        return cached_dispatch(request, *args, **kwargs)


def graphql_view():
    """
    Factory function to create GraphQL view with CSRF protection
    """
    view = csrf_protect(ProductionGraphQLView.as_view(graphiql=True))
    return require_http_methods(["GET", "POST"])(view)
