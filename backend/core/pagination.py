"""
Standardized Pagination for All API Endpoints

Ensures consistent response format across all paginated endpoints:
{
    "status": "success",
    "count": 1,
    "next": null,
    "previous": null,
    "results": [...]
}
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from core.utils.response import success_response


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination class for ALL endpoints
    
    Enforces consistent response structure:
    - Uses success_response wrapper
    - Standard page size
    - Consistent field names
    """
    
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Return standardized paginated response
        
        CRITICAL: All endpoints must use this format
        """
        response_data = {
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        }
        
        # Use success_response wrapper for consistency
        return success_response(
            message="Data retrieved successfully",
            data=response_data
        )


class FeedPagination(StandardResultsSetPagination):
    """
    Specialized pagination for feed endpoints
    Maintains same structure but allows different page sizes
    """
    page_size = 10  # Smaller for mobile feed
    max_page_size = 50


class StandardCursorPagination(PageNumberPagination):
    """
    Cursor-based pagination for real-time feeds
    Alternative to page-based pagination
    """
    
    page_size = 20
    cursor_query_param = 'cursor'
    ordering = '-created_at'
    
    def get_paginated_response(self, data):
        """Standardized cursor pagination response"""
        response_data = {
            'count': None,  # Cursor pagination doesn't provide total count
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        }
        
        return success_response(
            message="Data retrieved successfully",
            data=response_data
        )
