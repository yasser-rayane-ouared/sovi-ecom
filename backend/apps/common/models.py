"""
Base models and tenant-aware mixins for S Platform.
"""
import uuid
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract model with created/updated timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class TenantManager(models.Manager):
    """Manager that auto-filters by store_id from request context."""

    def for_store(self, store):
        return self.get_queryset().filter(store=store)


class TenantModel(TimeStampedModel):
    """Abstract model for tenant-scoped data. All tenant models inherit this."""
    store = models.ForeignKey(
        'stores.Store',
        on_delete=models.CASCADE,
        related_name='%(class)ss',
        db_index=True,
    )

    objects = TenantManager()

    class Meta:
        abstract = True


class UUIDModel(models.Model):
    """Abstract model using UUID primary key."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True
