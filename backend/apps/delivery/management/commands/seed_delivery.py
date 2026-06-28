"""
Seeding script for Algerian Wilayas and Communes.
"""
from django.core.management.base import BaseCommand
from apps.delivery.models import Wilaya, Commune, DeliveryCompany
from apps.delivery.wilaya_data import WILAYAS_DATA, seed_delivery_wilayas

class Command(BaseCommand):
    help = "Seeds the database with Algerian 58 Wilayas and communes, and default delivery companies"

    def handle(self, *args, **options):
        self.stdout.write("Seeding delivery companies...")
        companies = [
            ('yalidine', 'Yalidine Express', 'https://api.yalidine.app/v1'),
            ('zr_express', 'ZR Express', 'https://zrexpress.com/api'),
            ('noest', 'Noest', 'https://noest.com/api'),
            ('ems', 'EMS Algeria', 'https://ems.dz/api'),
            ('ecolog', 'Ecolog', 'https://ecolog.dz/api'),
            ('guepex', 'Guepex', 'https://guepex.app/api'),
            ('manual', 'Manual Settings', ''),
        ]

        for code, name, url in companies:
            DeliveryCompany.objects.get_or_create(
                name=code,
                defaults={
                    'display_name': name,
                    'api_base_url': url,
                    'is_active': True,
                }
            )
        # Add ecom delivery company
        DeliveryCompany.objects.update_or_create(
            name='ecom_delivery',
            defaults={
                'display_name': 'Ecom Delivery',
                'api_base_url': '',
                'logo': 'http://localhost:8000/media/delivery_logos/ecom_delivery.png',
                'is_active': True,
            }
        )

        self.stdout.write("Seeding 58 Wilayas...")
        created_count = seed_delivery_wilayas()

        communes_sample = {
            16: [
                ("الجزائر الوسطى", "Alger Centre", "16000"),
                ("باب الوادي", "Bab El Oued", "16009"),
                ("سيدي محمد", "Sidi M'Hamed", "16002"),
                ("المرادية", "El Mouradia", "16005"),
                ("بئر مراد رايس", "Bir Mourad Raïs", "16015"),
                ("القبة", "Kouba", "16050"),
                ("الحراش", "El Harrach", "16200"),
                ("دالي ابراهيم", "Dely Ibrahim", "16047"),
                ("الشراقة", "Cheraga", "16002"),
                ("زرالدة", "Zeralda", "16018"),
                ("رويبة", "Rouïba", "16110"),
                ("باب الزوار", "Bab Ezzouar", "16310"),
            ],
            31: [
                ("وهران", "Oran Centre", "31000"),
                ("بير الجير", "Bir El Djir", "31011"),
                ("السانية", "Es Senia", "31034"),
                ("أرزيو", "Arzew", "31200"),
                ("عين الترك", "Aïn El Turk", "31009"),
            ],
            25: [
                ("قسنطينة", "Constantine Centre", "25000"),
                ("الخروب", "El Khroub", "25100"),
                ("حامة بوزيان", "Hamma Bouziane", "25009"),
            ],
            9: [
                ("البليدة", "Blida Centre", "09000"),
                ("بوفاريك", "Boufarik", "09100"),
                ("أولاد يعيش", "Ouled Yaïch", "09003"),
            ],
            19: [
                ("سطيف", "Sétif Centre", "19000"),
                ("العلمة", "El Eulma", "19100"),
                ("عين أرنات", "Aïn Arnat", "19016"),
            ]
        }

        for code, (name_ar, name_fr) in WILAYAS_DATA.items():
            w = Wilaya.objects.get(code=code)

            # Seed communes for this wilaya
            if code in communes_sample:
                for c_ar, c_fr, pc in communes_sample[code]:
                    Commune.objects.get_or_create(
                        wilaya=w,
                        name_ar=c_ar,
                        name_fr=c_fr,
                        defaults={
                            'name_en': c_fr,
                            'postal_code': pc
                        }
                    )
            else:
                # Add default center commune for the others
                Commune.objects.get_or_create(
                    wilaya=w,
                    name_ar=name_ar,
                    name_fr=name_fr,
                    defaults={
                        'name_en': name_fr,
                        'postal_code': f"{code:02d}000"
                    }
                )

        self.stdout.write(self.style.SUCCESS("Algerian administrative regions seeded successfully!"))
