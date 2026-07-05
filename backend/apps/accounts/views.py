"""
Account views for S Platform.
"""
import uuid
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
import random


from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer, UserSerializer, ForgotPasswordSerializer,
    ResetPasswordSerializer, VerifyEmailSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new user account."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Auto-verify in demo/testing if SMTP is not configured
        if not settings.EMAIL_HOST_USER:
            user.is_verified = True
            user.save(update_fields=['is_verified'])

        # Send verification email
        try:
            frontend_url = 'https://sovi-dz.com'
            if getattr(settings, 'CORS_ALLOWED_ORIGINS', None) and len(settings.CORS_ALLOWED_ORIGINS) > 0:
                frontend_url = settings.CORS_ALLOWED_ORIGINS[0]
            if frontend_url.endswith('/'):
                frontend_url = frontend_url[:-1]

            send_mail(
                subject='Verify your S Platform account',
                message=f'Click to verify: {frontend_url}/verify?token={user.verification_token}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send verification email to {user.email}: {str(e)}", exc_info=True)

        return Response(
            {'message': 'Account created. Please check your email to verify.'},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """Verify user email with token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(verification_token=serializer.validated_data['token'])
            user.is_verified = True
            user.verification_token = None
            user.save()
            
            # Generate JWT tokens for auto-login
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Email verified successfully.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        except User.DoesNotExist:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationView(APIView):
    """Resend email verification link."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
            if user.is_verified:
                return Response({'message': 'Account is already verified.'})
            
            # Generate new token if not present
            if not user.verification_token:
                user.verification_token = uuid.uuid4()
                user.save()
            
            # Send verification email
            frontend_url = 'https://sovi-dz.com'
            if getattr(settings, 'CORS_ALLOWED_ORIGINS', None) and len(settings.CORS_ALLOWED_ORIGINS) > 0:
                frontend_url = settings.CORS_ALLOWED_ORIGINS[0]
            if frontend_url.endswith('/'):
                frontend_url = frontend_url[:-1]

            send_mail(
                subject='Verify your S Platform account',
                message=f'Click to verify: {frontend_url}/verify?token={user.verification_token}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return Response({'message': 'Verification email resent successfully.'})
        except User.DoesNotExist:
            return Response({'error': 'No user found with this email.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to resend verification email to {email}: {str(e)}", exc_info=True)
            return Response({'error': 'Failed to send email. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ForgotPasswordView(APIView):
    """Send password reset email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(email=serializer.validated_data['email'])
            user.password_reset_token = uuid.uuid4()
            user.save()
            send_mail(
                subject='Reset your S Platform password',
                message=f'Reset link: {settings.CORS_ALLOWED_ORIGINS[0]}/reset-password?token={user.password_reset_token}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass
        return Response({'message': 'If the email exists, a reset link has been sent.'})


class ResetPasswordView(APIView):
    """Reset password with token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(password_reset_token=serializer.validated_data['token'])
            user.set_password(serializer.validated_data['password'])
            user.password_reset_token = None
            user.save()
            return Response({'message': 'Password reset successfully.'})
        except User.DoesNotExist:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update current user profile."""
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class GoogleLoginView(APIView):
    """Sign in or register a user with Google ID token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('credential')
        if not token:
            return Response({'error': 'Google credential token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
        if not client_id:
            client_id = None
        
        try:
            # Verify the ID token
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
            
            # ID token is valid. Get user's info.
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            avatar = idinfo.get('picture', '')
            email_verified = idinfo.get('email_verified', False)

            if not email:
                return Response({'error': 'Email field not present in Google response.'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            # Dev mock fallback to allow testing without client id in development or demo mode
            if token.startswith("mock-google-token-") and (settings.DEBUG or not settings.GOOGLE_CLIENT_ID or "mock" in settings.GOOGLE_CLIENT_ID):
                email = token.replace("mock-google-token-", "")
                first_name = "Test"
                last_name = "User"
                avatar = ""
                email_verified = True
            else:
                return Response({'error': f'Invalid token verification: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve or create User
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'avatar': avatar,
                'is_verified': email_verified,
            }
        )

        # If user exists but is not verified, and Google verified their email, we can mark them verified.
        if not user.is_verified and email_verified:
            user.is_verified = True
            user.save(update_fields=['is_verified'])

        # Generate simplejwt tokens
        refresh = RefreshToken.for_user(user)
        
        # Serialize user data
        from .serializers import UserSerializer
        user_data = UserSerializer(user).data

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'created': created,
            'user': user_data
        }, status=status.HTTP_200_OK)


class SendOTPView(APIView):
    """Generate and send email verification OTP."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_verified:
            return Response({'message': 'Your email is already verified.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate 6-digit numeric OTP
        otp = f"{random.randint(100000, 999999)}"
        
        # Store in cache for 10 minutes (600 seconds)
        cache.set(f"email_otp_{user.id}", otp, timeout=600)
        
        # Send email
        try:
            send_mail(
                subject='Sovi - Verification Code / رمز التحقق',
                message=f'Votre code de vérification est : {otp}\nرمز التحقق الخاص بك هو: {otp}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return Response({'message': 'Verification code sent to your email.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyOTPView(APIView):
    """Verify email verification OTP and mark user verified."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_verified:
            return Response({'message': 'Your email is already verified.'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp_input = request.data.get('otp')
        if not otp_input:
            return Response({'error': 'Verification code (otp) is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        cached_otp = cache.get(f"email_otp_{user.id}")
        if not cached_otp:
            return Response({'error': 'Code expired or not requested. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if str(otp_input).strip() == str(cached_otp).strip():
            user.is_verified = True
            user.verification_token = None
            user.save(update_fields=['is_verified', 'verification_token'])
            cache.delete(f"email_otp_{user.id}")
            return Response({'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

