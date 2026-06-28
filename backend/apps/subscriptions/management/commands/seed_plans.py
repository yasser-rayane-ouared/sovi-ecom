from django.core.management.base import BaseCommand
from apps.subscriptions.models import Plan

class Command(BaseCommand):
    help = 'Seeds the default Starter, Pro, and Max subscription plans.'

    def handle(self, *args, **options):
        # ==========================================
        # MONTHLY PLANS
        # ==========================================
        
        # 1. Starter Plan (Monthly)
        plan_starter, created = Plan.objects.update_or_create(
            name='starter',
            defaults={
                'display_name_ar': 'المبتدئ',
                'price_da': 1200.00,
                'trial_days': 7,
                'max_products': 5,
                'max_workers': 1,
                'max_pixels': 2,
                'max_orders_per_month': 200,
                'has_variants': True,
                'has_ab_testing': True,
                'has_coupons': True,
                'has_custom_domain': True,
                'has_advanced_analytics': True,
                'has_otp': True,
                'has_captcha': True,
                'has_rate_limit': True,
                'has_algerian_ip': True,
                'has_sticky_cta': True,
                'has_api_access': True,
                'has_multi_store': True,
                'is_active': True,
            }
        )
        self.stdout.write(self.style.SUCCESS(f'{"Created" if created else "Updated"} Starter Plan: {plan_starter}'))

        # 2. Pro Plan (Monthly)
        plan_pro, created = Plan.objects.update_or_create(
            name='pro',
            defaults={
                'display_name_ar': 'المحترف',
                'price_da': 2500.00,
                'trial_days': 7,
                'max_products': 15,
                'max_workers': 5,
                'max_pixels': 5,
                'max_orders_per_month': 1000,
                'has_variants': True,
                'has_ab_testing': True,
                'has_coupons': True,
                'has_custom_domain': True,
                'has_advanced_analytics': True,
                'has_otp': True,
                'has_captcha': True,
                'has_rate_limit': True,
                'has_algerian_ip': True,
                'has_sticky_cta': True,
                'has_api_access': True,
                'has_multi_store': True,
                'is_active': True,
            }
        )
        self.stdout.write(self.style.SUCCESS(f'{"Created" if created else "Updated"} Pro Plan: {plan_pro}'))

        # 3. Max Plan (Monthly)
        plan_max, created = Plan.objects.update_or_create(
            name='max',
            defaults={
                'display_name_ar': 'الأقصى',
                'price_da': 4900.00,
                'trial_days': 7,
                'max_products': -1,
                'max_workers': -1,
                'max_pixels': -1,
                'max_orders_per_month': -1,
                'has_variants': True,
                'has_ab_testing': True,
                'has_coupons': True,
                'has_custom_domain': True,
                'has_advanced_analytics': True,
                'has_otp': True,
                'has_captcha': True,
                'has_rate_limit': True,
                'has_algerian_ip': True,
                'has_sticky_cta': True,
                'has_api_access': True,
                'has_multi_store': True,
                'is_active': True,
            }
        )
        self.stdout.write(self.style.SUCCESS(f'{"Created" if created else "Updated"} Max Plan: {plan_max}'))

        # ==========================================
        # YEARLY PLANS
        # ==========================================

        # 4. Starter Plan (Yearly)
        plan_starter_yr, created = Plan.objects.update_or_create(
            name='starter_yearly',
            defaults={
                'display_name_ar': 'المبتدئ (سنوي)',
                'price_da': 12000.00,
                'trial_days': 7,
                'max_products': 5,
                'max_workers': 1,
                'max_pixels': 2,
                'max_orders_per_month': 200,
                'has_variants': True,
                'has_ab_testing': True,
                'has_coupons': True,
                'has_custom_domain': True,
                'has_advanced_analytics': True,
                'has_otp': True,
                'has_captcha': True,
                'has_rate_limit': True,
                'has_algerian_ip': True,
                'has_sticky_cta': True,
                'has_api_access': True,
                'has_multi_store': True,
                'is_active': True,
            }
        )
        self.stdout.write(self.style.SUCCESS(f'{"Created" if created else "Updated"} Starter Yearly Plan: {plan_starter_yr}'))

        # 5. Pro Plan (Yearly)
        plan_pro_yr, created = Plan.objects.update_or_create(
            name='pro_yearly',
            defaults={
                'display_name_ar': 'المحترف (سنوي)',
                'price_da': 25000.00,
                'trial_days': 7,
                'max_products': 15,
                'max_workers': 5,
                'max_pixels': 5,
                'max_orders_per_month': 1000,
                'has_variants': True,
                'has_ab_testing': True,
                'has_coupons': True,
                'has_custom_domain': True,
                'has_advanced_analytics': True,
                'has_otp': True,
                'has_captcha': True,
                'has_rate_limit': True,
                'has_algerian_ip': True,
                'has_sticky_cta': True,
                'has_api_access': True,
                'has_multi_store': True,
                'is_active': True,
            }
        )
        self.stdout.write(self.style.SUCCESS(f'{"Created" if created else "Updated"} Pro Yearly Plan: {plan_pro_yr}'))

        # 6. Max Plan (Yearly)
        plan_max_yr, created = Plan.objects.update_or_create(
            name='max_yearly',
            defaults={
                'display_name_ar': 'الأقصى (سنوي)',
                'price_da': 49000.00,
                'trial_days': 7,
                'max_products': -1,
                'max_workers': -1,
                'max_pixels': -1,
                'max_orders_per_month': -1,
                'has_variants': True,
                'has_ab_testing': True,
                'has_coupons': True,
                'has_custom_domain': True,
                'has_advanced_analytics': True,
                'has_otp': True,
                'has_captcha': True,
                'has_rate_limit': True,
                'has_algerian_ip': True,
                'has_sticky_cta': True,
                'has_api_access': True,
                'has_multi_store': True,
                'is_active': True,
            }
        )
        self.stdout.write(self.style.SUCCESS(f'{"Created" if created else "Updated"} Max Yearly Plan: {plan_max_yr}'))

        self.stdout.write(self.style.SUCCESS('Plan seeding complete.'))
