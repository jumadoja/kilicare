"""
Custom authentication views with account lockout and failed login tracking.
"""
import logging
import uuid
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView as SimpleJWTTokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import AuthenticationFailed, TokenError
from django.core.mail import send_mail
from django.db.models import Q
from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings
from .models import User, PasswordResetOTP, UserSession
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from core.services.user_service import UpdateProfileService
from core.utils.response import success_response, error_response, flatten_serializer_errors
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes

# Structured auth logging
auth_logger = logging.getLogger('apps.users')
security_logger = logging.getLogger('django.contrib.auth')

# Maximum concurrent sessions per user
MAX_CONCURRENT_SESSIONS = 3


class SecureLoginView(TokenObtainPairView):
    """Login view with account lockout, session tracking, and failed login tracking."""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AnonRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        try:
            # Get username from request
            username = request.data.get('username', '')
            ip_address = self.get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Check if user exists and is locked BEFORE authentication
            user = User.objects.filter(username=username).first()
            if user and user.is_account_locked():
                security_logger.warning(
                    f"LOGIN_BLOCKED: User {username} account locked - IP: {ip_address}"
                )
                return Response(
                    {
                        "status": "locked",
                        "message": "Akaunti imefungwa kwa muda kutokana na majaribio mengi ya kuingia.",
                        "errors": ["Tafadhali jaribu tena baada ya muda au wasiliana na msaada."]
                    },
                    status=status.HTTP_423_LOCKED
                )
            
            # Attempt authentication
            serializer = self.get_serializer(data=request.data)
            
            try:
                serializer.is_valid(raise_exception=True)
            except AuthenticationFailed as e:
                # Authentication failed - increment failed login counter
                if user:
                    user.increment_failed_login()
                    security_logger.warning(
                        f"LOGIN_FAILED: User {username} failed login attempt {user.failed_login_attempts} - IP: {ip_address}"
                    )
                else:
                    security_logger.warning(
                        f"LOGIN_FAILED: Non-existent user {username} attempted - IP: {ip_address}"
                    )
                
                # Return generic error to avoid username enumeration
                return error_response(
                    message="Username au password si sahihi.",
                    errors=["Tafadhali angalia taarifa zako na ujaribu tena."],
                    http_status=status.HTTP_401_UNAUTHORIZED
                )
            except Exception as e:
                # Other validation errors
                errors = flatten_serializer_errors(getattr(serializer, 'errors', {}))
                auth_logger.error(
                    f"LOGIN_VALIDATION_ERROR: {username} - {errors} - IP: {ip_address}"
                )
                return error_response(
                    message="Imeshindikana kuingia. Tafadhali angalia taarifa zako.",
                    errors=errors,
                    http_status=status.HTTP_400_BAD_REQUEST
                )
            
            # Authentication successful - reset failed login counter
            user = serializer.user
            user.reset_failed_login()
            
            # Log successful login
            auth_logger.info(
                f"LOGIN_SUCCESS: User {user.id} ({user.username}) authenticated - IP: {ip_address}"
            )
            
            # Create session record
            session_id = str(uuid.uuid4())
            session = self.create_user_session(user, session_id, ip_address, user_agent)
            
            # Return SimpleJWT response with cookies
            response = super().post(request, *args, **kwargs)
            
            # Set httpOnly cookies for tokens
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            auth_cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
            refresh_cookie_name = settings.SIMPLE_JWT.get('REFRESH_COOKIE', 'refresh_token')
            cookie_httponly = settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTPONLY', True)
            cookie_secure = settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', True)
            cookie_samesite = settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
            cookie_path = settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')
            
            if access_token:
                response.set_cookie(
                    key=auth_cookie_name,
                    value=access_token,
                    expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                    httponly=cookie_httponly,
                    secure=cookie_secure,
                    samesite=cookie_samesite,
                    path=cookie_path,
                )
            
            if refresh_token:
                response.set_cookie(
                    key=refresh_cookie_name,
                    value=refresh_token,
                    expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                    httponly=cookie_httponly,
                    secure=cookie_secure,
                    samesite=cookie_samesite,
                    path=cookie_path,
                )
            
            # Add user data and session info to response
            user_data = UserSerializer(user).data
            response.data['user'] = user_data
            response.data['session_id'] = session_id
            
            # Remove tokens from response body (now in cookies)
            response.data.pop('access', None)
            response.data.pop('refresh', None)

            return response
            
        except Exception as e:
            auth_logger.error(
                f"LOGIN_SYSTEM_ERROR: Unexpected error for {username} - {str(e)} - IP: {ip_address}"
            )
            return error_response(
                message="Imeshindikana kuingia. Tafadhali jaribu tena.",
                errors=[str(e)],
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create_user_session(self, user, session_id, ip_address, user_agent):
        """Create and manage user session with concurrent session limit."""
        # Get active sessions for this user
        active_sessions = UserSession.objects.filter(
            user=user,
            is_active=True
        ).order_by('-created_at')
        
        # If limit exceeded, revoke oldest session
        if active_sessions.count() >= MAX_CONCURRENT_SESSIONS:
            oldest_session = active_sessions.last()
            oldest_session.is_active = False
            oldest_session.save()
            security_logger.info(
                f"SESSION_REVOKED: Oldest session revoked for user {user.username} - Session ID: {oldest_session.session_id}"
            )
        
        # Create new session
        session = UserSession.objects.create(
            user=user,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            device_type=self.detect_device_type(user_agent),
            device_name=self.detect_device_name(user_agent),
            expires_at=timezone.now() + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
        )
        
        auth_logger.info(
            f"SESSION_CREATED: New session for user {user.username} - Session ID: {session_id} - IP: {ip_address}"
        )
        
        return session
    
    def detect_device_type(self, user_agent):
        """Simple device type detection from user agent."""
        user_agent_lower = user_agent.lower()
        if 'mobile' in user_agent_lower or 'android' in user_agent_lower or 'iphone' in user_agent_lower:
            return 'mobile'
        elif 'tablet' in user_agent_lower or 'ipad' in user_agent_lower:
            return 'tablet'
        else:
            return 'desktop'
    
    def detect_device_name(self, user_agent):
        """Simple device name detection from user agent."""
        if 'Windows' in user_agent:
            return 'Windows'
        elif 'Mac' in user_agent:
            return 'MacOS'
        elif 'Linux' in user_agent:
            return 'Linux'
        elif 'Android' in user_agent:
            return 'Android'
        elif 'iPhone' in user_agent:
            return 'iPhone'
        elif 'iPad' in user_agent:
            return 'iPad'
        else:
            return 'Unknown'
    
    def get_client_ip(self, request):
        """Extract client IP address for logging"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class TokenRefreshView(SimpleJWTTokenRefreshView):
    """Custom token refresh view that reads refresh token from cookies."""
    
    def post(self, request, *args, **kwargs):
        # Read refresh token from cookie instead of request body
        refresh_cookie_name = settings.SIMPLE_JWT.get('REFRESH_COOKIE', 'refresh_token')
        refresh_token = request.COOKIES.get(refresh_cookie_name)
        
        if not refresh_token:
            return Response(
                {"detail": "No refresh token provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set the refresh token in request data for SimpleJWT to process
        request.data['refresh'] = refresh_token
        
        # Call parent post method
        response = super().post(request, *args, **kwargs)
        
        # Set new access token in cookie
        if 'access' in response.data:
            access_token = response.data['access']
            auth_cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
            cookie_httponly = settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTPONLY', True)
            cookie_secure = settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', True)
            cookie_samesite = settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
            cookie_path = settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')
            
            response.set_cookie(
                key=auth_cookie_name,
                value=access_token,
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                httponly=cookie_httponly,
                secure=cookie_secure,
                samesite=cookie_samesite,
                path=cookie_path,
            )
            # Remove access token from response body (now in cookie)
            response.data.pop('access', None)
        
        return response


