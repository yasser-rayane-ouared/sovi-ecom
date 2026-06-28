import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.urls import resolve
try:
    match = resolve('/api/products/daf5baab-3bda-42eb-afec-252851b49f25/5fa7475c-7cb1-49f3-b30f-caba0ca1e50d/duplicate/')
    print("MATCH SUCCESS:", match.func, match.url_name)
except Exception as e:
    print("MATCH FAILED:", str(e))
