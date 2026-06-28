"""
Common permissions for S Platform.
"""
from rest_framework import permissions


class IsStoreOwner(permissions.BasePermission):
    """Allow only the store owner to access."""

    def has_permission(self, request, view):
        store = getattr(request, 'store', None)
        if store is None:
            return False
        return store.owner == request.user


class IsStoreStaff(permissions.BasePermission):
    """Allow store owner or staff."""

    def has_permission(self, request, view):
        store = getattr(request, 'store', None)
        if store is None:
            return False
        return store.owner == request.user


class IsSuperAdmin(permissions.BasePermission):
    """Allow only platform super admins."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superadmin


class IsPublicStorefront(permissions.BasePermission):
    """Allow public access for storefront endpoints."""

    def has_permission(self, request, view):
        return True
