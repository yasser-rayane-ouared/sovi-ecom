import os
import sys
import django

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.delivery.serializers import StoreDeliveryConfigSerializer
from apps.delivery.models import DeliveryCompany
from apps.stores.models import Store

# Let's get a store and a company
store = Store.objects.get(id="daf5baab-3bda-42eb-afec-252851b49f25")
company = DeliveryCompany.objects.get(name="yalidine")

print(f"Store: {store.name}")
print(f"Company: {company.display_name} (ID: {company.id})")

# Construct the payload sent by the frontend
payload = {
    "company": str(company.id),
    "api_key": "some_test_key",
    "api_secret": "some_test_secret",
    "api_id": "some_test_id",
    "is_active": True,
    "is_default": False,
    "webhook_url": ""
}

print("\n--- Validating serializer ---")
serializer = StoreDeliveryConfigSerializer(data=payload, context={"store": store})
is_valid = serializer.is_valid()
print(f"Is valid: {is_valid}")
if not is_valid:
    print(f"Errors: {serializer.errors}")
else:
    print("Saving config...")
    try:
        instance = serializer.save()
        print(f"Saved successfully! ID: {instance.id}")
        # Clean up
        instance.delete()
        print("Cleaned up database config.")
    except Exception as e:
        print(f"Error during save: {e}")
        import traceback
        traceback.print_exc()
