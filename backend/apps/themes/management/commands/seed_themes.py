"""
Seeding script for S Platform default themes.
"""
from django.core.management.base import BaseCommand
from apps.themes.models import Theme

class Command(BaseCommand):
    help = "Seeds default conversion-optimized templates into the database"

    def handle(self, *args, **options):
        themes_data = [
            {
                'name': 'Classic Minimal',
                'slug': 'classic-minimal',
                'description': 'A clean, conversion-focused light theme with crisp typography and subtle animations. Perfect for fashion, beauty, and general retail.',
                'preview_image': 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop',
                'is_free': True,
                'creator': 'S Platform Team',
                'category': 'minimalist',
                'supports_rtl': True,
                'template_config': {
                    'colors': {
                        'primary': '#0f172a',
                        'secondary': '#475569',
                        'accent': '#6366f1',
                        'background': '#ffffff',
                        'surface': '#f8fafc',
                        'text': '#0f172a',
                    },
                    'typography': {
                        'fontFamily': 'Inter, sans-serif',
                        'baseSize': '16px'
                    },
                    'layout': {
                        'containerWidth': '1280px',
                        'borderRadius': '8px'
                    }
                }
            },
            {
                'name': 'Glassmorphic Dark',
                'slug': 'glassmorphic-dark',
                'description': 'A stunning modern dark mode theme featuring glowing gradients, glassmorphism card designs, and dynamic hover styles. Optimized for tech, gaming, and premium brands.',
                'preview_image': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop',
                'is_free': True,
                'creator': 'S Platform Team',
                'category': 'glassmorphism',
                'supports_rtl': True,
                'template_config': {
                    'colors': {
                        'primary': '#6366f1',
                        'secondary': '#a855f7',
                        'accent': '#10b981',
                        'background': '#0b0f19',
                        'surface': 'rgba(17, 24, 39, 0.7)',
                        'text': '#f3f4f6',
                    },
                    'typography': {
                        'fontFamily': 'Outfit, sans-serif',
                        'baseSize': '16px'
                    },
                    'layout': {
                        'containerWidth': '1280px',
                        'borderRadius': '16px'
                    }
                }
            },
            {
                'name': 'Vibrant Arabic',
                'slug': 'vibrant-arabic',
                'description': 'A warm, bold theme designed with a beautiful Arabic-first layout, rich RTL typography support (Cairo font), and conversion-optimized checkout layouts.',
                'preview_image': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop',
                'is_free': True,
                'creator': 'S Platform Team',
                'category': 'rtl-special',
                'supports_rtl': True,
                'template_config': {
                    'colors': {
                        'primary': '#ea580c',
                        'secondary': '#f97316',
                        'accent': '#15803d',
                        'background': '#fafaf9',
                        'surface': '#ffffff',
                        'text': '#1c1917',
                    },
                    'typography': {
                        'fontFamily': 'Cairo, sans-serif',
                        'baseSize': '16px'
                    },
                    'layout': {
                        'containerWidth': '1200px',
                        'borderRadius': '12px'
                    }
                }
            },
            {
                'name': 'Midnight Luxury',
                'slug': 'midnight-luxury',
                'description': 'A premium dark theme with deep gold and black colors. Tailored for high-end watch, perfume, jewelry, and luxury apparel shops.',
                'preview_image': 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop',
                'is_free': True,
                'creator': 'S Platform Team',
                'category': 'luxury',
                'supports_rtl': True,
                'template_config': {
                    'colors': {
                        'primary': '#d4af37',
                        'secondary': '#aa7c11',
                        'accent': '#ebd0a7',
                        'background': '#0a0806',
                        'surface': '#120e0a',
                        'text': '#ebd0a7',
                    },
                    'typography': {
                        'fontFamily': 'Cairo, serif',
                        'baseSize': '16px'
                    },
                    'layout': {
                        'containerWidth': '1150px',
                        'borderRadius': '4px'
                    }
                }
            },
            {
                'name': 'Emerald Mint',
                'slug': 'emerald-mint',
                'description': 'A fresh, crisp green and white theme. Perfect for organic products, cosmetics, health supplements, and modern apparel.',
                'preview_image': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop',
                'is_free': True,
                'creator': 'S Platform Team',
                'category': 'clean-organic',
                'supports_rtl': True,
                'template_config': {
                    'colors': {
                        'primary': '#0f766e',
                        'secondary': '#10b981',
                        'accent': '#34d399',
                        'background': '#fafaf9',
                        'surface': '#ffffff',
                        'text': '#1c1917',
                    },
                    'typography': {
                        'fontFamily': 'Cairo, sans-serif',
                        'baseSize': '16px'
                    },
                    'layout': {
                        'containerWidth': '1280px',
                        'borderRadius': '16px'
                    }
                }
            },
            {
                'name': 'Luxury Dark',
                'slug': 'luxury-dark',
                'description': 'A premium luxury dark theme with pure white text and gold/silver accents, optimized for high-end boutique storefronts, jewelry, perfumes, and premium fashion brands.',
                'preview_image': 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop',
                'is_free': True,
                'creator': 'S Platform Team',
                'category': 'luxury',
                'supports_rtl': True,
                'template_config': {
                    'colors': {
                        'primary': '#ffffff',
                        'secondary': '#d4af37',
                        'accent': '#d4af37',
                        'background': '#050505',
                        'surface': '#121212',
                        'text': '#ffffff',
                    },
                    'typography': {
                        'fontFamily': 'Cairo, serif',
                        'baseSize': '16px'
                    },
                    'layout': {
                        'containerWidth': '1200px',
                        'borderRadius': '12px'
                    }
                }
            }
        ]

        for t_data in themes_data:
            theme, created = Theme.objects.get_or_create(
                slug=t_data['slug'],
                defaults=t_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Theme '{theme.name}' created."))
            else:
                # Update settings
                for key, val in t_data.items():
                    setattr(theme, key, val)
                theme.save()
                self.stdout.write(f"Theme '{theme.name}' updated.")

        self.stdout.write(self.style.SUCCESS("S Platform default themes seeded successfully!"))
