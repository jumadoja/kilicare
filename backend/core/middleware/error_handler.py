"""
Centralized Error Handler Middleware
Prevents stack trace leakage in production and returns safe GraphQL errors
"""
from django.conf import settings
from graphql import GraphQLError
import traceback
import logging

logger = logging.getLogger('kilicare')


class GraphQLErrorHandler:
    """Centralized GraphQL error handler"""
    
    @staticmethod
    def format_error(error):
        """
        Format error for production - hide stack traces and sensitive info
        """
        if settings.DEBUG:
            # In development, show full error details
            return error
        
        # In production, return safe error messages only
        if isinstance(error, GraphQLError):
            # Return the error message without stack trace
            return GraphQLError(str(error))
        
        # For unexpected errors, return a generic message
        logger.error(f"Unexpected GraphQL error: {str(error)}")
        logger.error(traceback.format_exc())
        
        return GraphQLError("An internal server error occurred. Please try again later.")


def graphql_error_middleware(next, root, info, **args):
    """
    GraphQL middleware to handle errors centrally
    """
    try:
        return next(root, info, **args)
    except GraphQLError as e:
        # Re-raise GraphQL errors as-is (they're already formatted)
        raise e
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Unexpected error in GraphQL resolver: {str(e)}")
        logger.error(traceback.format_exc())
        
        if settings.DEBUG:
            # In development, raise the full error
            raise
        
        # In production, return a generic error
        raise GraphQLError("An internal server error occurred. Please try again later.")
