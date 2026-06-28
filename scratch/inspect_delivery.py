import os
import sys
import django

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.delivery.models import DeliveryCompany, StoreDeliveryConfig
from apps.stores.models import Store

print("--- DELIVERY COMPANIES ---")
for dc in DeliveryCompany.objects.all():
    print(f"ID: {dc.id} | Name: {dc.name} | Display Name: {dc.display_name} | Active: {dc.is_active}")

print("\n--- STORE DELIVERY CONFIGS ---")
for sdc in StoreDeliveryConfig.objects.all():
    print(f"ID: {sdc.id} | Store: {sdc.store.name} (ID: {sdc.store.id}) | Company: {sdc.company.display_name} (ID: {sdc.company.id}) | API ID: {sdc.api_id} | Active: {sdc.is_active}")

print("\n--- STORES ---")
for s in Store.objects.all():
    print(f"ID: {s.id} | Name: {s.name}")
