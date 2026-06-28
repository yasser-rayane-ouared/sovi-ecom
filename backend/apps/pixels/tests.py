from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.stores.models import Store
from apps.pixels.models import PixelConfig
from apps.products.models import Product

User = get_user_model()

class PixelConfigTests(APITestCase):
    def setUp(self):
        # Create user
        self.user = User.objects.create_user(
            email="testowner@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Owner"
        )
        # Create store
        self.store = Store.objects.create(
            owner=self.user,
            name="Test Store",
            slug="test-store",
            subdomain="teststore"
        )
        # Create a product for store
        self.product = Product.objects.create(
            store=self.store,
            title="Test Product",
            slug="test-product",
            price=10.00
        )
        # URL for listing/creating
        self.url = reverse('pixel-list', kwargs={'store_id': self.store.id})
        
        # Authenticate user
        self.client.force_authenticate(user=self.user)

    def test_create_pixel_config_global(self):
        """Test creating a pixel configuration that applies to the whole store."""
        data = {
            "name": "Global Facebook Pixel",
            "platform": "meta",
            "pixel_id": "1234567890",
            "is_active": True
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PixelConfig.objects.count(), 1)
        pixel = PixelConfig.objects.get()
        self.assertEqual(pixel.name, "Global Facebook Pixel")
        self.assertEqual(pixel.platform, "meta")
        self.assertEqual(pixel.pixel_id, "1234567890")
        self.assertEqual(pixel.store, self.store)
        self.assertNil = None # Using assertIsNone
        self.assertIsNone(pixel.product)

    def test_create_pixel_config_for_product(self):
        """Test creating a pixel configuration assigned to a product."""
        data = {
            "name": "TikTok Product Pixel",
            "platform": "tiktok",
            "pixel_id": "9876543210",
            "product": str(self.product.id),
            "is_active": True
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PixelConfig.objects.count(), 1)
        pixel = PixelConfig.objects.get()
        self.assertEqual(pixel.name, "TikTok Product Pixel")
        self.assertEqual(pixel.platform, "tiktok")
        self.assertEqual(pixel.pixel_id, "9876543210")
        self.assertEqual(pixel.product, self.product)

    def test_list_pixel_configs(self):
        """Test listing pixel configurations for a store."""
        PixelConfig.objects.create(
            store=self.store,
            name="Pixel 1",
            platform="meta",
            pixel_id="1"
        )
        PixelConfig.objects.create(
            store=self.store,
            name="Pixel 2",
            platform="snapchat",
            pixel_id="2"
        )
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify response list contains the pixels
        self.assertEqual(len(response.data), 2)
