"""
App configuration for the Algeria Locations app.
"""
from django.apps import AppConfig


class LocationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.locations'
    verbose_name = 'Algeria Locations'

    def ready(self):
        """Connect auto-seed signal for post_migrate."""
        import apps.locations.signals  # noqa: F401
