from django.apps import AppConfig


class OrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.orders'
    verbose_name = 'Orders'

    def ready(self):
        try:
            from .db_patch import auto_heal_schema
            auto_heal_schema()
        except Exception:
            pass
