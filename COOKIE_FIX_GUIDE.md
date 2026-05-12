# Cookie Authentication Fix Guide

## Problem Summary
- `/auth/login/` returns 200 OK but browser doesn't store `access_token` and `refresh_token` cookies
- `/auth/me/` returns 403 because cookies aren't sent
- WebSocket handshake has empty cookies

## Changes Made

### 1. Django Settings Updates

#### backend/config/settings/base.py
```python
'AUTH_COOKIE_SECURE': False,  # False for development, True in production
'AUTH_COOKIE_HTTP_ONLY': True,
'AUTH_COOKIE_SAMESITE': 'Lax',  # Changed from 'None' to 'Lax'
'AUTH_COOKIE_PATH': '/',
'AUTH_COOKIE_DOMAIN': 'localhost',  # Changed from None to localhost
```

#### backend/config/settings/dev.py
```python
# Development-specific overrides
SIMPLE_JWT = {
    **SIMPLE_JWT,
    'AUTH_COOKIE_SECURE': False,
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_SAMESITE': 'Lax',
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_DOMAIN': None,  # Let browser handle localhost
}

CORS_ALLOW_ALL_ORIGINS = True  # Only for development
CORS_ALLOW_CREDENTIALS = True
```

### 2. Enhanced Login View
- Added comprehensive debugging to `SecureLoginView`
- Updated to use `SecureLoginView` instead of `LoginView` in URLs
- Added debug endpoint `/api/auth/debug-cookies/`

### 3. Debug Endpoint
Created `/api/auth/debug-cookies/` to test cookie functionality:
- Shows received cookies
- Displays current JWT settings
- Sets test cookie to verify cookie setting works

## Testing Steps

### 1. Backend Testing
```bash
# Start Django server
python manage.py runserver

# Test with script
python test_cookies.py
```

### 2. Frontend Testing
1. Open browser DevTools → Application → Cookies
2. Attempt login through frontend
3. Check if `access_token` and `refresh_token` appear in cookies
4. Check Network tab for Set-Cookie headers in login response

### 3. Debug Endpoint Testing
```bash
# Test debug endpoint
curl -X GET http://localhost:8000/api/auth/debug-cookies/ -v
```

## Expected Results

### Successful Login Response Headers Should Include:
```
Set-Cookie: access_token=<jwt_value>; Path=/; SameSite=Lax; HttpOnly
Set-Cookie: refresh_token=<jwt_value>; Path=/; SameSite=Lax; HttpOnly
```

### Browser Cookies Should Show:
- `access_token` (HttpOnly)
- `refresh_token` (HttpOnly)
- `test_cookie` (from debug endpoint)

### WebSocket Should:
- Receive cookies in handshake
- Authenticate user properly

## Troubleshooting

### If cookies still don't appear:
1. Check browser console for errors
2. Verify Django is running in development mode
3. Check that frontend is running on `localhost:3000`
4. Verify CORS settings allow credentials

### If WebSocket still fails:
1. Check that cookies are set first
2. Verify WebSocket URL includes proper protocol
3. Check Django logs for WebSocket connection attempts

## Key Fixes Applied

1. **SameSite Policy**: Changed from 'None' to 'Lax' for localhost compatibility
2. **Domain Setting**: Set to 'localhost' in base, overridden to None in dev
3. **CORS Settings**: Added `CORS_ALLOW_ALL_ORIGINS = True` for development
4. **Enhanced Debugging**: Added comprehensive logging to track cookie flow
5. **Debug Endpoint**: Created test endpoint for isolated cookie testing

## Next Steps

1. Test the fixes with the provided script
2. Verify cookies appear in browser after login
3. Test `/auth/me/` endpoint returns 200
4. Verify WebSocket authentication works
5. Remove debug endpoints before production deployment
