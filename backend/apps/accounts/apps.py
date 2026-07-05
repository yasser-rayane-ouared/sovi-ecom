from django.apps import AppConfig


def create_default_superadmin():
    import os
    import logging
    from django.contrib.auth import get_user_model
    
    logger = logging.getLogger(__name__)
    
    try:
        User = get_user_model()
        # Check if the users table exists before querying to avoid AppRegistryNotReady / db errors
        User.objects.exists()
    except Exception:
        return
        
    try:
        email = os.environ.get('SUPERADMIN_EMAIL', 'admin@sovi-dz.com')
        password = os.environ.get('SUPERADMIN_PASSWORD', 'admin1234')
        
        logger.warning(f"Checking/seeding superadmin account: '{email}'")
        
        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(
                email=email,
                password=password,
                first_name='System',
                last_name='Admin'
            )
            logger.warning(f"Default superadmin account '{email}' created successfully.")
        else:
            user = User.objects.get(email=email)
            if not user.is_superadmin or not user.is_staff or not user.is_superuser or not user.is_verified:
                user.is_superadmin = True
                user.is_staff = True
                user.is_superuser = True
                user.is_verified = True
                user.save()
                logger.warning(f"Updated superadmin permissions for existing account '{email}'.")
    except Exception as e:
        logger.error(f"Failed to auto-seed superadmin: {str(e)}", exc_info=True)


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    verbose_name = 'Accounts'

    def ready(self):
        try:
            create_default_superadmin()
        except Exception:
            pass
