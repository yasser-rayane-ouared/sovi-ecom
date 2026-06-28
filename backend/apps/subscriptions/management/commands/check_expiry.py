from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.subscriptions.models import StoreSubscription

class Command(BaseCommand):
    help = 'Checks and updates store subscription statuses for expiry and warnings.'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # 1. Mark expired subscriptions
        expired_subs = StoreSubscription.objects.filter(
            status__in=['trial', 'active'],
            end_date__lt=now
        )
        expired_count = expired_subs.count()
        for sub in expired_subs:
            sub.status = 'expired'
            sub.save()
            
        if expired_count > 0:
            self.stdout.write(self.style.SUCCESS(f"Successfully expired {expired_count} subscriptions."))
        else:
            self.stdout.write("No newly expired subscriptions.")

        # 2. Check and mark 24h warning notifications
        warning_time = now + timedelta(hours=24)
        expiring_soon_subs = StoreSubscription.objects.filter(
            status__in=['trial', 'active'],
            end_date__gte=now,
            end_date__lte=warning_time,
            notified_24h=False
        )
        warning_count = expiring_soon_subs.count()
        for sub in expiring_soon_subs:
            sub.notified_24h = True
            sub.save()
            
        if warning_count > 0:
            self.stdout.write(self.style.SUCCESS(f"Marked {warning_count} subscriptions with 24h warning."))
        else:
            self.stdout.write("No subscriptions within 24h warning window.")
