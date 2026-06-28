"""
Management command to import all Algerian wilayas and communes.
Usage: python manage.py import_algeria_locations
"""
import json
import os
from django.core.management.base import BaseCommand
from apps.locations.models import Wilaya, Commune


class Command(BaseCommand):
    help = 'Import all 58 Algerian wilayas and their communes from JSON data.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force re-import even if data already exists (deletes existing data first).',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)

        if not force and Wilaya.objects.exists():
            self.stdout.write(
                self.style.WARNING(
                    f'Database already contains {Wilaya.objects.count()} wilayas '
                    f'and {Commune.objects.count()} communes. '
                    f'Use --force to re-import.'
                )
            )
            return

        if force:
            self.stdout.write(self.style.WARNING('Force mode: deleting existing location data...'))
            Commune.objects.all().delete()
            Wilaya.objects.all().delete()

        # Load JSON data
        data_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            'data',
            'algeria_locations.json'
        )

        if not os.path.exists(data_file):
            self.stderr.write(
                self.style.ERROR(f'Data file not found: {data_file}')
            )
            return

        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        wilaya_count = 0
        commune_count = 0

        for wilaya_data in data['wilayas']:
            wilaya, created = Wilaya.objects.get_or_create(
                code=wilaya_data['code'],
                defaults={'name': wilaya_data['name']}
            )
            if not created:
                wilaya.name = wilaya_data['name']
                wilaya.save()
            wilaya_count += 1

            # Bulk create communes for this wilaya
            communes_to_create = []
            existing_communes = set(
                wilaya.communes.values_list('name', flat=True)
            )
            seen_names = set()
            for commune_name in wilaya_data.get('communes', []):
                if commune_name not in existing_communes and commune_name not in seen_names:
                    communes_to_create.append(
                        Commune(wilaya=wilaya, name=commune_name)
                    )
                    seen_names.add(commune_name)

            if communes_to_create:
                Commune.objects.bulk_create(communes_to_create, batch_size=100)
                commune_count += len(communes_to_create)

            self.stdout.write(
                f'  Wilaya {wilaya.code:02d}: {wilaya.name} '
                f'({len(wilaya_data.get("communes", []))} communes)'
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully imported {wilaya_count} wilayas '
                f'and {commune_count} communes.'
            )
        )
