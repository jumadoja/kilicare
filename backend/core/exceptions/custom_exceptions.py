class ServiceError(Exception):
    """Base exception for service layer errors"""
    def __init__(self, message, code=None):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ValidationError(ServiceError):
    """Raised when input validation fails"""
    def __init__(self, message, field=None):
        self.field = field
        super().__init__(message, code='VALIDATION_ERROR')


class NotFoundError(ServiceError):
    """Raised when a resource is not found"""
    def __init__(self, message, resource_type=None):
        self.resource_type = resource_type
        super().__init__(message, code='NOT_FOUND')


class PermissionDeniedError(ServiceError):
    """Raised when user lacks permission"""
    def __init__(self, message, action=None):
        self.action = action
        super().__init__(message, code='PERMISSION_DENIED')


class AuthenticationError(ServiceError):
    """Raised when authentication fails"""
    def __init__(self, message):
        super().__init__(message, code='AUTHENTICATION_ERROR')
