"""
Startup validation helper for critical security configuration.
Validates environment variables and security settings at application startup.
"""

import os
from django.core.exceptions import ImproperlyConfigured


def validate_secret_key(value, env_var_name, env):
    """
    Validate that a secret key is provided and is not the default insecure value.
    
    Args:
        value: The secret key value to validate
        env_var_name: The environment variable name for error messages
        env: Current environment (development/production)
        
    Raises:
        ImproperlyConfigured: If the secret key is missing or uses an insecure default
    """
    if not value:
        raise ImproperlyConfigured(
            f"CRITICAL: {env_var_name} environment variable is not set. "
            f"Application cannot start without this value."
        )
    
    # In production, reject known insecure default values
    if env == "production":
        insecure_defaults = [
            'dev-secret-key-change-in-production',
            'dev-jwt-secret-key-change-in-production',
            'changeme',
            'secret',
            'your-secret-key-here',
        ]
        
        if value.lower() in insecure_defaults:
            raise ImproperlyConfigured(
                f"CRITICAL: {env_var_name} is using an insecure default value in production. "
                f"Please set a secure {env_var_name} environment variable."
            )
        
        # Ensure minimum length for security in production
        if len(value) < 32:
            raise ImproperlyConfigured(
                f"CRITICAL: {env_var_name} is too short for production (minimum 32 characters required). "
                f"Current length: {len(value)}"
            )


def validate_required_env_var(env_var_name, description=""):
    """
    Validate that a required environment variable is set.
    
    Args:
        env_var_name: The environment variable name
        description: Optional description of what the variable is for
        
    Raises:
        ImproperlyConfigured: If the environment variable is not set
    """
    value = os.getenv(env_var_name)
    if not value:
        desc_msg = f" ({description})" if description else ""
        raise ImproperlyConfigured(
            f"CRITICAL: {env_var_name} environment variable is not set.{desc_msg} "
            f"Application cannot start without this value."
        )
    return value


def validate_debug_mode():
    """
    Validate DEBUG mode configuration.
    Ensure DEBUG=False in production environments.
    
    Raises:
        ImproperlyConfigured: If DEBUG=True in production environment
    """
    env = os.getenv("ENV", "development").lower()
    debug = os.getenv("DJANGO_DEBUG", "false").lower() == "true"
    
    if env == "production" and debug:
        raise ImproperlyConfigured(
            "CRITICAL: DEBUG=True is not allowed in production environment. "
            "Set DJANGO_DEBUG=false or ENV=development."
        )


def validate_database_config():
    """
    Validate database configuration based on environment.
    PostgreSQL is REQUIRED in all environments.
    
    Raises:
        ImproperlyConfigured: If database configuration is invalid
    """
    # PostgreSQL is now required in all environments
    required_vars = {
        "DB_NAME": "PostgreSQL database name",
        "DB_USER": "PostgreSQL username",
        "DB_PASSWORD": "PostgreSQL password",
        "DB_HOST": "PostgreSQL host",
    }
    
    for var_name, description in required_vars.items():
        validate_required_env_var(var_name, description)
    
    # Validate DB_PORT if provided
    db_port = os.getenv("DB_PORT", "5432")
    try:
        int(db_port)
    except ValueError:
        raise ImproperlyConfigured(
            f"CRITICAL: DB_PORT must be a valid integer. Current value: {db_port}"
        )


def validate_cors_origins():
    """
    Validate CORS configuration.
    Ensure CORS_ALLOW_ALL_ORIGINS is False in production.
    
    Raises:
        ImproperlyConfigured: If CORS configuration is insecure
    """
    env = os.getenv("ENV", "development").lower()
    cors_allow_all = os.getenv("CORS_ALLOW_ALL_ORIGINS", "false").lower() == "true"
    
    if env == "production" and cors_allow_all:
        raise ImproperlyConfigured(
            "CRITICAL: CORS_ALLOW_ALL_ORIGINS=True is not allowed in production. "
            "Set CORS_ALLOW_ALL_ORIGINS=false and configure CORS_ALLOWED_ORIGINS."
        )


def validate_email_config():
    """
    Validate email configuration for production.
    
    Raises:
        ImproperlyConfigured: If email configuration is missing in production
    """
    env = os.getenv("ENV", "development").lower()
    
    if env == "production":
        validate_required_env_var("EMAIL_HOST_USER", "Email sender address")
        validate_required_env_var("EMAIL_HOST_PASSWORD", "Email password")


def validate_redis_config():
    """
    Validate Redis configuration for production.
    
    Raises:
        ImproperlyConfigured: If Redis configuration is missing in production
    """
    env = os.getenv("ENV", "development").lower()
    
    if env == "production":
        # Validate Celery Redis configuration
        broker_url = os.getenv("CELERY_BROKER_URL")
        result_backend = os.getenv("CELERY_RESULT_BACKEND")
        
        if not broker_url or not result_backend:
            raise ImproperlyConfigured(
                "CRITICAL: CELERY_BROKER_URL and CELERY_RESULT_BACKEND must be set in production."
            )


def validate_allowed_hosts():
    """
    Validate ALLOWED_HOSTS configuration.
    
    Raises:
        ImproperlyConfigured: If ALLOWED_HOSTS is empty in production
    """
    env = os.getenv("ENV", "development").lower()
    allowed_hosts = os.getenv("ALLOWED_HOSTS", "")
    
    if env == "production" and not allowed_hosts:
        raise ImproperlyConfigured(
            "CRITICAL: ALLOWED_HOSTS environment variable is not set in production. "
            "Please set ALLOWED_HOSTS to your production domain(s)."
        )


def validate_production_config():
    """
    Run all production configuration validations.
    This should be called at application startup AFTER settings are loaded.
    It validates the actual settings values, not just environment variables.
    
    Raises:
        ImproperlyConfigured: If any critical configuration is invalid
    """
    # Import settings to validate actual values (not just env vars)
    # This must be done after settings are loaded to account for dev.py/prod.py overrides
    from django.conf import settings
    
    env = os.getenv("ENV", "development").lower()
    
    # Always validate these (critical for any environment)
    validate_debug_mode()
    
    # Production-specific validations
    if env == "production":
        # Validate actual SECRET_KEY value (after dev.py/prod.py overrides)
        validate_secret_key(
            settings.SECRET_KEY,
            "SECRET_KEY"
        )
        validate_secret_key(
            settings.JWT_SECRET_KEY,
            "JWT_SECRET_KEY"
        )
        validate_required_env_var("GROQ_API_KEY", "Groq AI API key")
        validate_database_config()
        validate_email_config()
        validate_redis_config()
        validate_allowed_hosts()
        validate_cors_origins()
