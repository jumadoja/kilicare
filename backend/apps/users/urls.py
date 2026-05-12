from django.urls import path
from .views import RegisterUserView, MeView, LoginView, ForgotPasswordView, ResetPasswordView, LogoutView, CheckUsernameView, CheckEmailView
from .auth_views import SecureLoginView, TokenRefreshView

urlpatterns = [
    path('check-username/', CheckUsernameView.as_view(), name='check-username'),
    path('check-email/', CheckEmailView.as_view(), name='check-email'),
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', SecureLoginView.as_view(), name='login'),  # Use SecureLoginView instead of LoginView
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
]