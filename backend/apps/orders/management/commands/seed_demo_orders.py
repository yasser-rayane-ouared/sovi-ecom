"""
Management command to seed realistic demo orders for a store.
Usage: python manage.py seed_demo_orders --subdomain=mc --count=25
"""
import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from apps.stores.models import Store
from apps.products.models import Product
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.delivery.models import Wilaya, Commune

NAMES = [
    "Karim Benali", "Amine Zerrouki", "Yacine Belkacem", "Sofia Hamidi",
    "Mohamed Saidi", "Meriem Cherif", "Walid Mansouri", "Nour El Houda",
    "Oussama Bouzid", "Fatima Zohra Khelifi", "Abderrahmane Rahmouni",
    "Khadija Amrani", "Riad Meziane", "Amina Boudiaf", "Billal Khelil"
]

STATUSES = [
    'new', 'new', 'new', 'confirmed', 'confirmed',
    'shipped', 'delivered', 'delivered', 'no_answer_1', 'returned'
]

VARIANTS = [
    "اللون: أسود / الحجم: L",
    "اللون: أبيض / الحجم: M",
    "اللون: أزرق / الحجم: XL",
    "Size: Standard / Color: Black",
    "Pack 1x - Regular"
]

class Command(BaseCommand):
    help = 'Seed realistic test orders for a specific store'

    def add_arguments(self, parser):
        parser.add_argument('--subdomain', type=str, default='mc', help='Store subdomain')
        parser.add_argument('--count', type=int, default=25, help='Number of orders to generate')

    def handle(self, *args, **options):
        subdomain = options['subdomain']
        count = options['count']

        store = Store.objects.filter(subdomain=subdomain).first()
        if not store:
            store = Store.objects.first()
            if not store:
                self.stderr.write(self.style.ERROR("No store found."))
                return

        products = list(Product.objects.filter(store=store))
        if not products:
            products = list(Product.objects.all())

        if not products:
            self.stderr.write(self.style.ERROR("No products available to generate orders."))
            return

        wilayas = list(Wilaya.objects.all())
        now = timezone.now()

        created_count = 0
        for i in range(count):
            customer_name = random.choice(NAMES)
            phone = f"0{random.choice([5, 6, 7])}{random.randint(10000000, 99999999)}"
            phone2 = f"0{random.choice([5, 6, 7])}{random.randint(10000000, 99999999)}" if random.random() > 0.6 else ""
            
            # Random date within last 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            mins_ago = random.randint(0, 59)
            created_date = now - timedelta(days=days_ago, hours=hours_ago, minutes=mins_ago)

            wilaya = random.choice(wilayas) if wilayas else None
            communes = list(Commune.objects.filter(wilaya=wilaya)) if wilaya else []
            commune = random.choice(communes) if communes else None

            product = random.choice(products)
            qty = random.choice([1, 1, 1, 2, 3])
            unit_price = float(product.price or 2500)
            subtotal = unit_price * qty
            delivery_price = random.choice([400, 600, 800])
            total = subtotal + delivery_price

            order_num = f"ORD-{random.randint(10000, 99999)}"
            status = random.choice(STATUSES)

            order = Order.objects.create(
                store=store,
                order_number=order_num,
                full_name=customer_name,
                phone=phone,
                phone2=phone2,
                wilaya=wilaya,
                commune=commune,
                address=f"شارع المركز، حي {random.randint(1, 50)}",
                subtotal=subtotal,
                delivery_price=delivery_price,
                total=total,
                status=status,
                is_abandoned=False
            )
            
            # Override auto_now_add for created_at to simulate dates over last 30 days
            Order.objects.filter(id=order.id).update(created_at=created_date)
            order.refresh_from_db()

            # Create OrderItem with variant name
            variant_text = random.choice(VARIANTS) if random.random() > 0.3 else ""
            OrderItem.objects.create(
                order=order,
                product=product,
                product_title=product.title,
                variant_name=variant_text,
                quantity=qty,
                price=unit_price,
                total=subtotal
            )

            # Create OrderStatusHistory
            OrderStatusHistory.objects.create(
                order=order,
                from_status='new',
                to_status=status,
                note='Order initialized'
            )

            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Successfully generated {created_count} realistic test orders for store '{store.name}' ({store.subdomain})!")
        )
