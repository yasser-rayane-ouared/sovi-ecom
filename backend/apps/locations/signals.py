"""
Signal to auto-seed Algeria location data when the database is empty.
This runs once on first startup after migrations.
"""
import logging
from django.db.models.signals import post_migrate
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_migrate)
def auto_seed_locations(sender, **kwargs):
    """
    After migrations, check if location data exists.
    If not, automatically import from JSON.
    """
    import sys
    if 'test' in sys.argv or 'pytest' in sys.argv:
        return

    if sender.name != 'apps.locations':
        return

    from apps.locations.models import Wilaya

    if Wilaya.objects.exists():
        return

    logger.info('No location data found. Auto-seeding Algeria wilayas and communes...')

    try:
        from django.core.management import call_command
        call_command('import_algeria_locations')
        logger.info('Auto-seed complete.')
    except Exception as e:
        logger.warning(f'Auto-seed failed (run "python manage.py import_algeria_locations" manually): {e}')
