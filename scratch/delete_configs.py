import os
import sys
import django

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.delivery.models import StoreDeliveryConfig

deleted_count, _ = StoreDeliveryConfig.objects.all().delete()
print(f"Deleted {deleted_count} StoreDeliveryConfig records.")
