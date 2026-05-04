#!/usr/bin/env python
"""
Test script to verify async avatar processing fix
Run with: python test_async_avatar.py
"""
import os
import sys
import django
from django.test import TestCase
from unittest.mock import patch, MagicMock
from io import BytesIO
from PIL import Image

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from apps.users.models import User, Profile
from apps.users.serializers import UserSerializer
from apps.users.tasks import process_avatar_task
from django.core.files.uploadedfile import SimpleUploadedFile


def create_test_image():
    """Create a test image for testing"""
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes


def test_registration_flow():
    """Test that registration doesn't block on avatar processing"""
    print("Testing registration flow...")
    
    # Create test image
    img_bytes = create_test_image()
    test_file = SimpleUploadedFile("test.jpg", img_bytes.getvalue(), content_type="image/jpeg")
    
    # Test data
    user_data = {
        'username': 'testuser123',
        'email': 'test@example.com',
        'password': 'testpass123',
        'role': 'TOURIST',
        'avatar': test_file
    }
    
    # Mock the async task to prevent actual processing during test
    with patch('apps.users.tasks.process_avatar_task.delay') as mock_task:
        mock_task.return_value = MagicMock(id='test-task-id')
        
        serializer = UserSerializer(data=user_data)
        is_valid = serializer.is_valid()
        
        if not is_valid:
            print("Validation failed:", serializer.errors)
            return False
            
        # Create user - this should be fast and not block
        user = serializer.save()
        
        # Verify async task was called
        mock_task.assert_called_once()
        task_args = mock_task.call_args[1]
        
        assert task_args['user_id'] == user.id
        assert 'file_data' in task_args
        
        print("Registration flow works - async task queued")
        return True


def test_signal_safety():
    """Test that signals don't trigger image processing"""
    print("Testing signal safety...")
    
    # Create user without triggering image processing
    user_data = {
        'username': 'signaltest',
        'email': 'signal@example.com', 
        'password': 'testpass123',
        'role': 'TOURIST'
    }
    
    user = User.objects.create_user(**user_data)
    
    # Verify profile was created without image processing
    assert hasattr(user, 'profile')
    assert user.profile.avatar.name == ''  # Should be empty
    
    print("Signals are safe - no image processing")
    return True


def test_async_task():
    """Test the async avatar processing task"""
    print("Testing async avatar task...")
    
    # Create user and profile
    user = User.objects.create_user(
        username='tasktest',
        email='task@example.com',
        password='testpass123',
        role='TOURIST'
    )
    
    # Create test image data
    img_bytes = create_test_image()
    
    # Run the task synchronously for testing
    result = process_avatar_task(user_id=user.id, file_data=img_bytes.getvalue())
    
    assert result['success'] == True
    assert 'filename' in result
    
    # Refresh profile and check avatar was processed
    user.profile.refresh_from_db()
    assert user.profile.avatar.name != ''
    
    # Clean up
    if user.profile.avatar and os.path.exists(user.profile.avatar.path):
        os.unlink(user.profile.avatar.path)
    
    print("Async task processes images correctly")
    return True


def main():
    """Run all tests"""
    print("Starting Async Avatar Processing Tests\n")
    
    tests = [
        test_registration_flow,
        test_signal_safety, 
        test_async_task
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"{test.__name__} failed: {str(e)}")
            failed += 1
        print()
    
    print(f"Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("All tests passed! The async avatar processing fix is working correctly.")
        return True
    else:
        print("Some tests failed. Please check the implementation.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
