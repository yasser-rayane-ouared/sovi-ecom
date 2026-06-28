from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

class NameOrEmailBackend(ModelBackend):
    """Custom authentication backend allowing login via email or username.
    
    Handles both USERNAME_FIELD='email' (where Django passes email=value)
    and USERNAME_FIELD='username' (where Django passes username=value).
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()
        # When USERNAME_FIELD='email', SimpleJWT/Django passes the value as
        # kwargs['email'] rather than the positional 'username' parameter.
        credential = username or kwargs.get('email') or kwargs.get('username')
        if not credential:
            return None
        try:
            # Match credential against either email or username
            user = User.objects.filter(Q(email=credential) | Q(username=credential)).first()
            if user and user.check_password(password) and self.user_can_authenticate(user):
                return user
        except Exception:
            return None
        return None

