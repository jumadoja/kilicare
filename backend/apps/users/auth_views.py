"""
Custom authentication views with account lockout and failed login tracking.
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.core.mail import send_mail
from django.db.models import Q
from django.contrib.auth import authenticate
from .models import User, PasswordResetOTP
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from core.services.user_service import UpdateProfileService
from core.utils.response import success_response, error_response, flatten_serializer_errors
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.throttling import AnonRateThrottle


class SecureLoginView(TokenObtainPairView):
    """Login view with account lockout and failed login tracking."""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AnonRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        print("STEP 1: Request received in SecureLoginView")
        try:
            print("STEP 2: Entered try block")
            # Get username from request
            username = request.data.get('username', '')
            print(f"STEP 3: Username extracted: {username}")
            
            # Check if user exists and is locked BEFORE authentication
            print("STEP 4: Before user query")
            user = User.objects.filter(username=username).first()
            print(f"STEP 5: User query completed, user found: {user is not None}")
            if user and user.is_account_locked():
                return error_response(
                    message="Akaunti imefungwa kwa muda kutokana na majaribio mengi ya kuingia.",
                    errors=["Tafadhali jaribu tena baada ya muda au wasiliana na msaada."],
                    http_status=status.HTTP_423_LOCKED
                )
            
            # Attempt authentication
            print("STEP 6: Before serializer creation")
            serializer = self.get_serializer(data=request.data)
            print("STEP 7: Serializer created")
            
            try:
                print("STEP 8: Before serializer validation")
                serializer.is_valid(raise_exception=True)
                print("STEP 9: Serializer validation successful")
            except AuthenticationFailed as e:
                print(f"STEP 10: Authentication failed: {e}")
                # Authentication failed - increment failed login counter
                if user:
                    print("STEP 11: Incrementing failed login counter")
                    user.increment_failed_login()
                
                # Return generic error to avoid username enumeration
                return error_response(
                    message="Username au password si sahihi.",
                    errors=["Tafadhali angalia taarifa zako na ujaribu tena."],
                    http_status=status.HTTP_401_UNAUTHORIZED
                )
            except Exception as e:
                print(f"STEP 12: Other validation error: {e}")
                # Other validation errors
                errors = flatten_serializer_errors(getattr(serializer, 'errors', {}))
                return error_response(
                    message="Imeshindikana kuingia. Tafadhali angalia taarifa zako.",
                    errors=errors,
                    http_status=status.HTTP_400_BAD_REQUEST
                )
            
            # Authentication successful - reset failed login counter
            print("STEP 13: Authentication successful")
            user = serializer.user
            print("STEP 14: Before resetting failed login counter")
            user.reset_failed_login()
            print("STEP 15: After resetting failed login counter")
            
            # Return standardized response
            print("STEP 16: Before returning response")
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return error_response(
                message="Imeshindikana kuingia. Tafadhali jaribu tena.",
                errors=[str(e)],
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
