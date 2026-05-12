from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from django.core.mail import send_mail
from django.db.models import Q
from django.conf import settings
from .models import User, PasswordResetOTP
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from core.services.user_service import UpdateProfileService
from core.utils.response import success_response, error_response, flatten_serializer_errors
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads token from httpOnly cookie instead of Authorization header.
    """
    def get_header(self, request):
        """
        Get the JWT token from httpOnly cookie instead of Authorization header.
        """
        # Try to get token from cookie first
        auth_cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
        token = request.COOKIES.get(auth_cookie_name)
        if token:
            # Return in the format expected by SimpleJWT: "Bearer <token>"
            auth_header_type = settings.SIMPLE_JWT.get('AUTH_HEADER_TYPES', ('Bearer',))[0]
            return f"{auth_header_type} {token}".encode()
        
        # Fallback to Authorization header for backward compatibility
        return super().get_header(request)


# Check username availability
@method_decorator(csrf_exempt, name='dispatch')
class CheckUsernameView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        username = request.query_params.get('username', '')
        exists = User.objects.filter(username=username).exists()
        return Response({'exists': exists, 'username': username})

# Check email availability
@method_decorator(csrf_exempt, name='dispatch')
class CheckEmailView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        email = request.query_params.get('email', '')
        exists = User.objects.filter(email=email).exists()
        return Response({'exists': exists, 'email': email})

# Register user
class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]
    throttle_scope = 'register'

    def post(self, request, *args, **kwargs):
        # Handle multipart/form-data with avatar
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            errors = flatten_serializer_errors(serializer.errors)
            response = error_response(
                message="Imeshindikana kujisajili. Tafadhali angalia taarifa zako.",
                errors=errors,
                http_status=status.HTTP_400_BAD_REQUEST
            )
            return response

        try:
            user = serializer.save()
            # Standard response format: all payload data inside data object
            user_data = UserSerializer(user).data
            return success_response(
                message="Akaunti imewekwa kikamilifu. Karibu KilicareGO+",
                data=user_data,
                http_status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return error_response(
                message="Imeshindikana kujisajili. Tafadhali jaribu tena.",
                errors=[str(e)],
                http_status=status.HTTP_400_BAD_REQUEST
            )

# Me view - OPTIMIZED VERSION
class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def get_object(self):
        """Return current authenticated user"""
        return self.request.user

    def get(self, request, *args, **kwargs):
        """Get current user profile - STANDARDIZED UserDTO response"""
        user = self.get_object()
        serializer = self.get_serializer(user)
        
        # Return UserDTO-compliant response
        from core.utils.response import success_response
        return success_response(
            message="User profile retrieved successfully",
            data=serializer.data
        )

    def put(self, request, *args, **kwargs):
        """Optimized PUT method for profile updates"""
        import time
        start_time = time.time()
        
        try:
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            # Use service layer for profile updates
            service = UpdateProfileService()
            profile_data = {}
            
            # Build profile data from serializer
            for field in ['phone_number', 'bio', 'location']:
                if field in serializer.validated_data:
                    profile_data[field] = serializer.validated_data[field]
            
            # Update email directly on user if provided
            if 'email' in serializer.validated_data:
                request.user.email = serializer.validated_data['email']
                request.user.save()
            
            profile = service.execute(
                user=request.user,
                profile_data=profile_data if profile_data else {}
            )
            
            end_time = time.time()
            print(f"⚡ /auth/me/ PUT completed in {(end_time - start_time) * 1000:.2f}ms")
            
            # Return standardized UserDTO response
            from core.utils.response import success_response
            return success_response(
                message="Profile updated successfully",
                data=UserSerializer(request.user).data
            )
        except Exception as e:
            end_time = time.time()
            print(f"❌ /auth/me/ PUT failed in {(end_time - start_time) * 1000:.2f}ms: {e}")
            return Response(
                {"detail": str(e), "code": "PROFILE_UPDATE_ERROR"},
                status=status.HTTP_400_BAD_REQUEST
            )

# Login view
from .auth_views import SecureLoginView as LoginView

# Forgot password view
class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer
    permission_classes = []
    throttle_classes = [AnonRateThrottle]
    throttle_scope = 'forgot_password'

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        value = serializer.validated_data['email_or_phone']

        # Ensure username exists AND email/phone matches
        user = User.objects.filter(username=username).filter(Q(email=value) | Q(profile__phone_number=value)).first()
        if not user:
            return error_response(
                message="Username au email/phone haipatikani",
                errors=["Username or email/phone mismatch"],
                http_status=status.HTTP_404_NOT_FOUND
            )
        
        otp_obj = PasswordResetOTP.objects.create(user=user)

        # Send OTP via email if email exists
        if user.email:
            send_mail(
                subject="Your OTP Code",
                message=f"Hello {user.username}, your OTP code is {otp_obj.otp}. It expires in 10 minutes.",
                from_email=None,
                recipient_list=[user.email],
                fail_silently=False,
            )

        return success_response(
            message=f"OTP imetumwa kwa {value}",
            data={"destination": value},
            http_status=status.HTTP_200_OK
        )

# Reset password view
class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = []
    throttle_classes = [AnonRateThrottle]
    throttle_scope = 'reset_password'

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        reset_obj = PasswordResetOTP.objects.filter(otp=otp, is_used=False).first()
        if not reset_obj:
            return error_response(
                message="OTP batili au imeshatumika",
                errors=["Invalid or used OTP"],
                http_status=status.HTTP_400_BAD_REQUEST
            )

        if not reset_obj.is_valid():
            return error_response(
                message="OTP imeisha muda",
                errors=["OTP expired"],
                http_status=status.HTTP_400_BAD_REQUEST
            )

        # Direct password reset (OTP-based, no old password needed)
        reset_obj.user.set_password(new_password)
        reset_obj.user.save()
        reset_obj.is_used = True
        reset_obj.save()
        return success_response(
            message="Nenosiri imebadilishwa kikamilifu",
            http_status=status.HTTP_200_OK
        )

# Logout view
class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def post(self, request):
        try:
            # Get refresh token from cookie
            refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['REFRESH_COOKIE'])
            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                    security_logger.info(
                        f"LOGOUT_SUCCESS: User {request.user.username} logged out - IP: {self.get_client_ip(request)}"
                    )
                except TokenError as e:
                    security_logger.warning(
                        f"LOGOUT_TOKEN_ERROR: Invalid refresh token for user {request.user.username} - {str(e)}"
                    )
            
            # Invalidate all user sessions
            from .models import UserSession
            UserSession.objects.filter(
                user=request.user,
                is_active=True
            ).update(is_active=False)
            
            # Delete cookies
            response = success_response(
                message="Umefunga akaunti kikamilifu",
                http_status=status.HTTP_200_OK
            )
            auth_cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
            refresh_cookie_name = settings.SIMPLE_JWT.get('REFRESH_COOKIE', 'refresh_token')
            response.delete_cookie(auth_cookie_name)
            response.delete_cookie(refresh_cookie_name)
            return response
        except Exception as e:
            return error_response(
                message="Token batili",
                errors=[str(e)],
                http_status=status.HTTP_400_BAD_REQUEST
            )
    
    def get_client_ip(self, request):
        """Extract client IP address for logging"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip