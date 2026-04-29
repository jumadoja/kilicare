from rest_framework.permissions import BasePermission

class IsAdminAI(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsAuthenticatedAI(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
