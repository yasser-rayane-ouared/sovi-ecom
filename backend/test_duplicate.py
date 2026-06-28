import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from apps.stores.models import Store
from apps.products.models import Product

store_id = 'daf5baab-3bda-42eb-afec-252851b49f25'
product_id = '5fa7475c-7cb1-49f3-b30f-caba0ca1e50d'

try:
    store = Store.objects.get(id=store_id)
    print("Store found:", store.name, "Owner:", store.owner.email)
except Store.DoesNotExist:
    print("Store NOT found")

try:
    product = Product.objects.get(id=product_id)
    print("Product found:", product.title, "Store:", product.store.id)
    if str(product.store.id) == store_id:
        print("Product belongs to store")
    else:
        print("Product belongs to DIFFERENT store:", product.store.id)
except Product.DoesNotExist:
    print("Product NOT found")
