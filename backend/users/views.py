from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.mail import send_mail
from django.db.models import Q
from .models import User, PasswordResetOTP
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, ForgotPasswordSerializer, ResetPasswordSerializer

# Register user
class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

# Me view
class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

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
            return Response({"detail": "Username or email/phone mismatch"}, status=status.HTTP_404_NOT_FOUND)
        
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

        return Response({"detail": f"OTP sent to {value}"}, status=status.HTTP_200_OK)

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
            return Response({"detail": "Invalid or used OTP"}, status=status.HTTP_400_BAD_REQUEST)

        if not reset_obj.is_valid():
            return Response({"detail": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)

        user = reset_obj.user
        user.set_password(new_password)
        user.save()
        reset_obj.is_used = True
        reset_obj.save()
        return Response({"detail": "Password reset successful"}, status=status.HTTP_200_OK)