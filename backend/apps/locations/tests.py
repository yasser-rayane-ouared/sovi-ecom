"""
Tests for Algeria locations app.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from .models import Wilaya, Commune


class WilayaModelTest(TestCase):
    """Tests for the Wilaya model."""

    def setUp(self):
        self.wilaya = Wilaya.objects.create(code=16, name='Alger')

    def test_str_representation(self):
        self.assertEqual(str(self.wilaya), '16 - Alger')

    def test_unique_code(self):
        with self.assertRaises(Exception):
            Wilaya.objects.create(code=16, name='Duplicate')

    def test_ordering(self):
        Wilaya.objects.create(code=1, name='Adrar')
        Wilaya.objects.create(code=31, name='Oran')
        wilayas = list(Wilaya.objects.values_list('code', flat=True))
        self.assertEqual(wilayas, [1, 16, 31])


class CommuneModelTest(TestCase):
    """Tests for the Commune model."""

    def setUp(self):
        self.wilaya = Wilaya.objects.create(code=16, name='Alger')
        self.commune = Commune.objects.create(
            wilaya=self.wilaya, name='Alger Centre'
        )

    def test_str_representation(self):
        self.assertEqual(str(self.commune), 'Alger Centre (Alger)')

    def test_unique_together(self):
        with self.assertRaises(Exception):
            Commune.objects.create(
                wilaya=self.wilaya, name='Alger Centre'
            )

    def test_cascade_delete(self):
        self.wilaya.delete()
        self.assertEqual(Commune.objects.count(), 0)


class WilayaAPITest(TestCase):
    """Tests for the Wilaya API endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.wilaya1 = Wilaya.objects.create(code=1, name='Adrar')
        self.wilaya2 = Wilaya.objects.create(code=16, name='Alger')

    def test_list_wilayas(self):
        response = self.client.get('/api/wilayas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_wilayas_ordered_by_code(self):
        response = self.client.get('/api/wilayas/')
        self.assertEqual(response.data[0]['code'], 1)
        self.assertEqual(response.data[1]['code'], 16)

    def test_wilaya_response_format(self):
        response = self.client.get('/api/wilayas/')
        wilaya = response.data[0]
        self.assertIn('id', wilaya)
        self.assertIn('code', wilaya)
        self.assertIn('name', wilaya)

    def test_no_pagination(self):
        """Wilayas endpoint should return all results without pagination."""
        response = self.client.get('/api/wilayas/')
        self.assertIsInstance(response.data, list)

    def test_public_access(self):
        """Wilayas endpoint should be accessible without authentication."""
        response = self.client.get('/api/wilayas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class CommuneAPITest(TestCase):
    """Tests for the Commune API endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.wilaya = Wilaya.objects.create(code=16, name='Alger')
        self.wilaya2 = Wilaya.objects.create(code=31, name='Oran')
        Commune.objects.create(wilaya=self.wilaya, name='Alger Centre')
        Commune.objects.create(wilaya=self.wilaya, name='Bab El Oued')
        Commune.objects.create(wilaya=self.wilaya2, name='Oran Centre')

    def test_list_communes_filtered(self):
        response = self.client.get(f'/api/communes/?wilaya={self.wilaya.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_communes_filter_other_wilaya(self):
        response = self.client.get(f'/api/communes/?wilaya={self.wilaya2.id}')
        self.assertEqual(len(response.data), 1)

    def test_commune_response_format(self):
        response = self.client.get(f'/api/communes/?wilaya={self.wilaya.id}')
        commune = response.data[0]
        self.assertIn('id', commune)
        self.assertIn('name', commune)
        # Should NOT include wilaya info in basic serializer
        self.assertNotIn('wilaya', commune)

    def test_public_access(self):
        response = self.client.get(f'/api/communes/?wilaya={self.wilaya.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_communes_ordered_by_name(self):
        response = self.client.get(f'/api/communes/?wilaya={self.wilaya.id}')
        names = [c['name'] for c in response.data]
        self.assertEqual(names, sorted(names))
