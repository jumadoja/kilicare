from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    """
    Only admin users can access these endpoints
    """
    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and hasattr(request.user, "role")
            and request.user.role == "ADMIN"
        )

