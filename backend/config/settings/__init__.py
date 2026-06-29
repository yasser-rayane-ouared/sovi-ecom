"""
Django settings entry point for Sovi Platform.

When DJANGO_SETTINGS_MODULE is set to 'config.settings', this module is
imported directly. It delegates to the appropriate environment-specific
settings module based on the DJANGO_ENV environment variable:

  - production / prod  → config.settings.prod
  - anything else      → config.settings.dev  (default)

Individual sub-modules (config.settings.dev, config.settings.prod) can
still be referenced directly when a more explicit override is needed.
"""
import os

_env = os.environ.get("DJANGO_ENV", "dev").lower()

if _env in ("production", "prod"):
    from .prod import *  # noqa: F401, F403
else:
    from .dev import *  # noqa: F401, F403
