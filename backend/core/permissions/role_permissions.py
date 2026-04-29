from rest_framework import permissions


class IsTourist(permissions.BasePermission):
    """
    Permission class for Tourist role only
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role == 'TOURIST'
        )


class IsLocalGuide(permissions.BasePermission):
    """
    Permission class for Local Guide role only
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role == 'LOCAL_GUIDE'
        )


class IsAdmin(permissions.BasePermission):
    """
    Permission class for Admin role only
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role == 'ADMIN'
        )


class IsTouristOrLocal(permissions.BasePermission):
    """
    Permission class for Tourist or Local Guide roles
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role in ['TOURIST', 'LOCAL_GUIDE']
        )


class IsLocalOrAdmin(permissions.BasePermission):
    """
    Permission class for Local Guide or Admin roles
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role in ['LOCAL_GUIDE', 'ADMIN']
        )
