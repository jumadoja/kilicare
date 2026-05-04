"""
Custom password validators for Kilicare authentication system.
These validators ensure backend password rules match frontend requirements exactly.
"""
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
import re


class ComplexityValidator:
    """
    Validates that password contains:
    - At least 1 uppercase letter (A-Z)
    - At least 1 number (0-9)
    - At least 1 special character (non-alphanumeric)
    
    This matches the frontend Zod validation rules in validators.ts
    """
    def validate(self, password, user=None):
        # Check for at least 1 uppercase letter
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Password lazima iwe na herufi kubwa moja"),
                code='password_no_uppercase',
            )
        
        # Check for at least 1 number
        if not re.search(r'[0-9]', password):
            raise ValidationError(
                _("Password lazima iwe na namba moja"),
                code='password_no_number',
            )
        
        # Check for at least 1 special character (non-alphanumeric)
        if not re.search(r'[^A-Za-z0-9]', password):
            raise ValidationError(
                _("Password lazima iwe na alama moja (kama !@#)"),
                code='password_no_special',
            )
    
    def get_help_text(self):
        return _(
            "Password yako lazima iwe na herufi kubwa moja, namba moja, "
            "na alama moja ya kipekee (kama !@#)."
        )
