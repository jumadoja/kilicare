from rest_framework.permissions import BasePermission


class IsLocalUser(BasePermission):
    """
    Only local users can create tips
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "role")
            and request.user.role == "LOCAL_GUIDE"
        )
