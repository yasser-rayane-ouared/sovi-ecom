"""
Delivery models — wilayas, communes, delivery companies, pricing.
"""
import uuid
from django.db import models
from apps.common.models import TenantModel, TimeStampedModel


class Wilaya(models.Model):
    """Algerian wilaya (province)."""
    code = models.IntegerField(unique=True, db_index=True)
    name_ar = models.CharField(max_length=100)
    name_fr = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'wilayas'
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name_ar}'


class Commune(models.Model):
    """Algerian commune (city/municipality)."""
    wilaya = models.ForeignKey(Wilaya, on_delete=models.CASCADE, related_name='communes')
    name_ar = models.CharField(max_length=100)
    name_fr = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=10, blank=True)

    class Meta:
        db_table = 'communes'
        ordering = ['name_ar']

    def __str__(self):
        return f'{self.name_ar} ({self.wilaya.name_ar})'


class DeliveryCompany(TimeStampedModel):
    """Delivery company registry."""
    COMPANY_CHOICES = [
        ('yalidine', 'Yalidine'),
        ('zr_express', 'ZR Express'),
        ('ems', 'EMS'),
        ('manual', 'Manual Settings'),
        ('ecom_delivery', 'Ecom Delivery'),
        ('maystro_delivery', 'Maystro Delivery'),
        ('flash_delivery', 'Flash Delivery'),
        
        # Legacy/aliases Ecotrack names (for backward compatibility)
        ('noest', 'Noest'),
        ('ecolog', 'Ecolog'),
        ('guepex', 'Guepex'),
        ('gupex', 'Gupex'),
        ('dhd', 'DHD'),
        ('yaliteck', 'Yaliteck'),
        
        # EcoTrack Partners:
        ('48hr_livraison', '48hr Livraison'),
        ('allo_livraison', 'Allo Livraison'),
        ('anderson_delivery', 'Anderson Delivery'),
        ('areex', 'Areex'),
        ('assil_delivery', 'Assil Delivery'),
        ('baconsult', 'BaConsult'),
        ('colireli', 'Colireli'),
        ('colivraison_express', 'Colivraison Express'),
        ('coyote_express', 'Coyote Express'),
        ('delivromail', 'Delivromail'),
        ('dhd_express', 'DHD Express'),
        ('distazero', 'Distazero'),
        ('expedia_chrono', 'Expedia Chrono'),
        ('fretdirect', 'Fretdirect'),
        ('fz_delivery', 'FZ Delivery'),
        ('golivri', 'Golivri'),
        ('hhd_express', 'HHD Express'),
        ('imir', 'Imir'),
        ('medexpress', 'MedExpress'),
        ('monohub', 'MonoHub'),
        ('msm_go', 'MSM Go'),
        ('navex_delivery', 'Navex Delivery'),
        ('negmar_express', 'Negmar Express'),
        ('noest_express', 'Noest Express'),
        ('om_express', 'OM Express'),
        ('ontime_ecotrack', 'Ontime EcoTrack'),
        ('packers', 'Packers'),
        ('pdex', 'Pdex'),
        ('prest', 'Prest'),
        ('rb_livraison', 'RB Livraison'),
        ('rex_livraison', 'Rex Livraison'),
        ('rocket_delivery', 'Rocket Delivery'),
        ('salva_delivery', 'Salva Delivery'),
        ('samex_delivery', 'SamEx Delivery'),
        ('speed_delivery', 'Speed Delivery'),
        ('swift_express', 'Swift Express'),
        ('tsl_express', 'TSL Express'),
        ('ultra_express', 'Ultra Express'),
        ('univer_delivery', 'Univer Delivery'),
        ('worldexpress', 'Worldexpress'),
        ('zvit_express', 'Z-Vit Express'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, choices=COMPANY_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    api_base_url = models.URLField(blank=True)
    logo = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    supports_tracking = models.BooleanField(default=True)

    class Meta:
        db_table = 'delivery_companies'
        verbose_name_plural = 'Delivery companies'

    def __str__(self):
        return self.display_name


class StoreDeliveryConfig(TenantModel):
    """Per-store delivery company configuration — admin inputs API key here."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(DeliveryCompany, on_delete=models.CASCADE, related_name='store_configs')
    api_key = models.CharField(max_length=500, blank=True, help_text='API key provided by delivery company')
    api_secret = models.CharField(max_length=500, blank=True, help_text='API secret/token')
    api_id = models.CharField(max_length=200, blank=True, help_text='API ID (e.g., Yalidine API ID)')
    is_active = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    webhook_url = models.URLField(blank=True)

    class Meta:
        db_table = 'store_delivery_configs'
        unique_together = ['store', 'company']

    def __str__(self):
        return f'{self.store.name} - {self.company.display_name}'


class DeliveryPricing(TenantModel):
    """Per-store delivery pricing per wilaya/commune."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wilaya = models.ForeignKey(Wilaya, on_delete=models.CASCADE, related_name='pricing')
    commune = models.ForeignKey(Commune, on_delete=models.CASCADE, null=True, blank=True, related_name='pricing')
    home_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    desk_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'delivery_pricing'

    def save(self, *args, **kwargs):
        """Invalidate storefront cached wilayas pricing list when pricing changes."""
        super().save(*args, **kwargs)
        try:
            from django.core.cache import cache
            store = self.store
            cache.delete(f"storefront_wilayas_{store.subdomain.lower()}")
            if store.custom_domain:
                cache.delete(f"storefront_wilayas_{store.custom_domain.lower()}")
        except Exception:
            pass

    def __str__(self):
        return f'{self.store.name} - {self.wilaya.name_ar}: {self.home_price} DZD'


class Shipment(TenantModel):
    """Tracking a shipment created via delivery company API."""
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('returned', 'Returned'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='shipments')
    company = models.ForeignKey(DeliveryCompany, on_delete=models.CASCADE)
    tracking_number = models.CharField(max_length=100, blank=True)
    external_id = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    status_message = models.TextField(blank=True)
    label_url = models.URLField(blank=True)

    class Meta:
        db_table = 'shipments'

    def __str__(self):
        return f'Shipment {self.tracking_number} for {self.order.order_number}'
