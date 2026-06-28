import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.products.views import ProductDuplicateView
from django.contrib.auth import get_user_model
from apps.products.models import Product

User = get_user_model()
store_id = 'daf5baab-3bda-42eb-afec-252851b49f25'
product_id = '5fa7475c-7cb1-49f3-b30f-caba0ca1e50d'

try:
    user = User.objects.get(email='yasseeward@gmail.com')
    factory = APIRequestFactory()
    request = factory.post(f'/api/products/{store_id}/{product_id}/duplicate/')
    force_authenticate(request, user=user)
    
    view = ProductDuplicateView.as_view()
    response = view(request, store_id=store_id, product_id=product_id)
    print("STATUS CODE:", response.status_code)
    print("RESPONSE DATA:", response.data)
except Exception as e:
    import traceback
    traceback.print_exc()
