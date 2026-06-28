from django.http import Http404
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied
from .models import Store, StoreWorker

def get_store_for_user(store_id, user, permission_required=None):
    """
    Resolve a store for the given user.
    If the user is the store owner, they have full access.
    If the user is a worker, checks if they have the specific permission.
    If they are neither or the store doesn't exist, raises 404 (Store not found)
    to protect store privacy, or 403 (Permission Denied) if they are a worker
    but lack the required privilege.
    """
    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication credentials were not provided.")

    try:
        store = Store.objects.get(
            Q(id=store_id) & (Q(owner=user) | Q(workers__user=user))
        )
    except Store.DoesNotExist:
        raise Http404("Store not found.")

    if store.owner == user:
        return store

    # The user must be a worker. Let's find their StoreWorker record.
    try:
        worker = store.workers.get(user=user)
    except StoreWorker.DoesNotExist:
        raise PermissionDenied("You are not authorized as a worker for this store.")

    if permission_required:
        has_perm = getattr(worker, f"can_manage_{permission_required}", False)
        if not has_perm:
            raise PermissionDenied("You do not have permission to perform this action.")

    return store
