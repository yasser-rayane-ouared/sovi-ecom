import io
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.stores.models import Store
from apps.products.models import Product, ProductImage

User = get_user_model()

class ProductTests(APITestCase):
    def setUp(self):
        # Create user
        self.user = User.objects.create_user(
            email="productowner@example.com",
            password="testpassword123",
            first_name="Product",
            last_name="Owner"
        )
        # Create store
        self.store = Store.objects.create(
            owner=self.user,
            name="Product Store",
            slug="product-store",
            subdomain="productstore"
        )
        
        # URL for listing/creating products
        self.url = reverse('product-list', kwargs={'store_id': self.store.id})
        
        # Authenticate user
        self.client.force_authenticate(user=self.user)

    def test_create_product_auto_slug(self):
        """Test creating a product with auto slug generation."""
        data = {
            "title": "ساعة ذكية ممتازة",
            "price": 3500.00,
            "stock": 150,
            "sku": "SMART-001",
            "description": "وصف الساعة الذكية الممتازة."
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)
        
        product = Product.objects.get()
        self.assertEqual(product.title, "ساعة ذكية ممتازة")
        self.assertEqual(product.price, 3500.00)
        self.assertEqual(product.stock_quantity, 150)
        # Verify slug auto generated and works with Arabic characters
        self.assertIsNotNone(product.slug)
        self.assertIn("ساعة-ذكية-ممتازة", product.slug)

    def test_upload_image_to_store_storage(self):
        """Test uploading product image using the general upload endpoint."""
        upload_url = reverse('product-image-upload', kwargs={'store_id': self.store.id})
        
        # Create a dummy image file in memory
        file_content = b"fake-image-bytes"
        image_file = SimpleUploadedFile(
            name="test_product_image.jpg",
            content=file_content,
            content_type="image/jpeg"
        )
        
        response = self.client.post(upload_url, {'file': image_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('image_url', response.data)
        self.assertIn('test_product_image', response.data['image_url'])
