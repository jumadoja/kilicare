"""
Unified API response utilities for consistent JSON responses across all endpoints.
"""
from rest_framework.response import Response
from rest_framework import status
from typing import Any, Dict, List, Optional


def success_response(
    message: str,
    data: Optional[Dict[str, Any]] = None,
    http_status: int = status.HTTP_200_OK
) -> Response:
    """
    Standard success response format.
    
    Args:
        message: Success message
        data: Optional data payload
        http_status: HTTP status code (default: 200)
    
    Returns:
        Response with standard format:
        {
            "status": "success",
            "message": "string",
            "data": {}
        }
    """
    response_data = {
        "status": "success",
        "message": message,
    }
    
    if data is not None:
        response_data["data"] = data
    
    return Response(response_data, status=http_status)


def error_response(
    message: str,
    errors: Optional[List[str]] = None,
    http_status: int = status.HTTP_400_BAD_REQUEST
) -> Response:
    """
    Standard error response format.
    
    Args:
        message: Error message
        errors: Optional list of specific error messages
        http_status: HTTP status code (default: 400)
    
    Returns:
        Response with standard format:
        {
            "status": "error",
            "message": "string",
            "errors": []
        }
    """
    response_data = {
        "status": "error",
        "message": message,
    }
    
    if errors is not None:
        response_data["errors"] = errors
    
    return Response(response_data, status=http_status)


def flatten_serializer_errors(serializer_errors: Dict[str, Any]) -> List[str]:
    """
    Flatten Django REST Framework serializer errors into a list of readable strings.
    
    Args:
        serializer_errors: DRF serializer errors dictionary
    
    Returns:
        List of flat error messages
    """
    flat_errors = []
    
    for field, error in serializer_errors.items():
        if isinstance(error, list):
            for e in error:
                if isinstance(e, dict):
                    # Handle nested errors
                    for nested_field, nested_error in e.items():
                        if isinstance(nested_error, list):
                            for ne in nested_error:
                                flat_errors.append(f"{field}.{nested_field}: {str(ne)}")
                        else:
                            flat_errors.append(f"{field}.{nested_field}: {str(nested_error)}")
                else:
                    flat_errors.append(f"{field}: {str(e)}")
        elif isinstance(error, dict):
            # Handle nested dictionary errors
            for nested_field, nested_error in error.items():
                if isinstance(nested_error, list):
                    for ne in nested_error:
                        flat_errors.append(f"{field}.{nested_field}: {str(ne)}")
                else:
                    flat_errors.append(f"{field}.{nested_field}: {str(nested_error)}")
        else:
            flat_errors.append(f"{field}: {str(error)}")
    
    return flat_errors
