from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.db.models import Q
from .models import User, PasswordResetOTP
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from core.services.user_service import UpdateProfileService
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

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

    def post(self, request, *args, **kwargs):
        # Handle multipart/form-data with avatar
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = serializer.save()
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"detail": str(e), "code": "REGISTRATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST
            )

# Me view
class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def put(self, request, *args, **kwargs):
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
        
        try:
            profile = service.execute(
                user=request.user,
                profile_data=profile_data if profile_data else {}
            )
            return Response(
                UserSerializer(request.user).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": str(e), "code": "PROFILE_UPDATE_ERROR"},
                status=status.HTTP_400_BAD_REQUEST
            )

# Login view
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# Forgot password view
class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer
    permission_classes = []

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        value = serializer.validated_data['email_or_phone']

        # Ensure username exists AND email/phone matches
        user = User.objects.filter(username=username).filter(Q(email=value) | Q(profile__phone_number=value)).first()
        if not user:
            return Response({"detail": "Username or email/phone mismatch", "code": "USER_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)
        
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

        return Response({"detail": f"OTP sent to {value}", "code": "OTP_SENT"}, status=status.HTTP_200_OK)

# Reset password view
class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = []

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        reset_obj = PasswordResetOTP.objects.filter(otp=otp, is_used=False).first()
        if not reset_obj:
            return Response({"detail": "Invalid or used OTP", "code": "INVALID_OTP"}, status=status.HTTP_400_BAD_REQUEST)

        if not reset_obj.is_valid():
            return Response({"detail": "OTP expired", "code": "OTP_EXPIRED"}, status=status.HTTP_400_BAD_REQUEST)

        # Direct password reset (OTP-based, no old password needed)
        reset_obj.user.set_password(new_password)
        reset_obj.user.save()
        reset_obj.is_used = True
        reset_obj.save()
        return Response({"detail": "Password reset successful", "code": "PASSWORD_RESET_SUCCESS"}, status=status.HTTP_200_OK)

# Logout view
class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"detail": "Successfully logged out", "code": "LOGOUT_SUCCESS"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": "Invalid token", "code": "INVALID_TOKEN"}, status=status.HTTP_400_BAD_REQUEST)