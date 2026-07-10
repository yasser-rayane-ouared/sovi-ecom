"""
Order models for S Platform — COD only.
"""
import uuid
from django.db import models
from apps.common.models import TenantModel


class Order(TenantModel):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('no_answer', 'Client Not Answering'),
        ('no_answer_1', 'Client Not Answering (Call 1)'),
        ('no_answer_2', 'Client Not Answering (Call 2)'),
        ('no_answer_3', 'Client Not Answering (Call 3)'),
        ('postponed', 'Confirmation Postponed'),
        ('confirmed', 'Confirmed'),
        ('pending', 'Pending'),
        ('prepared', 'Prepared'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, db_index=True)
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    phone2 = models.CharField(max_length=20, blank=True)
    wilaya = models.ForeignKey('delivery.Wilaya', on_delete=models.PROTECT, related_name='orders')
    commune = models.ForeignKey('delivery.Commune', on_delete=models.PROTECT, related_name='orders', null=True, blank=True)
    address = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='new')
    source = models.CharField(max_length=50, blank=True, help_text='Traffic source (e.g., facebook, tiktok)')
    utm_source = models.CharField(max_length=100, blank=True)
    utm_medium = models.CharField(max_length=100, blank=True)
    utm_campaign = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    is_abandoned = models.BooleanField(default=False)
    coupon_code = models.CharField(max_length=50, blank=True, default='')
    coupon_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    inventory_deducted = models.BooleanField(default=False)
    whatsapp_sent = models.BooleanField(default=False)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f'Order {self.order_number}'

    def deduct_inventory(self):
        """Deducts stock for all items in this order if track_inventory is enabled."""
        if self.is_abandoned or self.inventory_deducted:
            return

        from django.db import transaction
        with transaction.atomic():
            for item in self.items.all():
                product = item.product
                variant = item.variant
                qty = item.quantity

                if product.track_inventory:
                    if variant:
                        from apps.products.models import ProductVariant
                        locked_variant = ProductVariant.objects.select_for_update().get(id=variant.id)
                        locked_variant.stock_quantity = max(0, locked_variant.stock_quantity - qty)
                        locked_variant.save(update_fields=['stock_quantity'])
                    else:
                        from apps.products.models import Product
                        locked_product = Product.objects.select_for_update().get(id=product.id)
                        locked_product.stock_quantity = max(0, locked_product.stock_quantity - qty)
                        locked_product.save(update_fields=['stock_quantity'])

            self.inventory_deducted = True
            self.save(update_fields=['inventory_deducted'])

    def restore_inventory(self):
        """Restores stock for all items in this order if inventory was previously deducted."""
        if not self.inventory_deducted:
            return

        from django.db import transaction
        with transaction.atomic():
            for item in self.items.all():
                product = item.product
                variant = item.variant
                qty = item.quantity

                if product.track_inventory:
                    if variant:
                        from apps.products.models import ProductVariant
                        locked_variant = ProductVariant.objects.select_for_update().get(id=variant.id)
                        locked_variant.stock_quantity = locked_variant.stock_quantity + qty
                        locked_variant.save(update_fields=['stock_quantity'])
                    else:
                        from apps.products.models import Product
                        locked_product = Product.objects.select_for_update().get(id=product.id)
                        locked_product.stock_quantity = locked_product.stock_quantity + qty
                        locked_product.save(update_fields=['stock_quantity'])

        self.inventory_deducted = False
        self.save(update_fields=['inventory_deducted'])

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        status_changed = False

        if not is_new:
            old_instance = Order.objects.filter(id=self.id).first()
            if old_instance and old_instance.status != self.status:
                status_changed = True

        if not self.order_number:
            last = Order.objects.filter(store=self.store).order_by('-created_at').first()
            num = 1
            if last and last.order_number:
                try:
                    num = int(last.order_number.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    num = 1
            self.order_number = f'ORD-{num:06d}'

        super().save(*args, **kwargs)

        if not is_new and status_changed:
            if self.status in ['cancelled', 'returned']:
                self.restore_inventory()
            else:
                self.deduct_inventory()

            try:
                import threading
                from django.db import transaction
                from apps.integrations.tasks import _send_telegram_for_order, sync_order_to_google_sheet

                order_id = self.id

                def _run_status_integrations():
                    try:
                        _send_telegram_for_order(order_id, is_new=False)
                    except Exception:
                        pass
                    try:
                        sync_order_to_google_sheet(order_id)
                    except Exception:
                        pass

                transaction.on_commit(lambda: threading.Thread(target=_run_status_integrations, daemon=True).start())
            except Exception:
                pass


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='order_items')
    variant = models.ForeignKey('products.ProductVariant', on_delete=models.SET_NULL, null=True, blank=True)
    product_title = models.CharField(max_length=255)
    variant_name = models.CharField(max_length=100, blank=True)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'order_items'

    def save(self, *args, **kwargs):
        self.total = self.price * self.quantity
        super().save(*args, **kwargs)


class OrderStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=15)
    to_status = models.CharField(max_length=15)
    note = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_status_history'
        ordering = ['-changed_at']
