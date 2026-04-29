import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(token):
    try:
        # Tunadecode token kwa kutumia SECRET_KEY ya Django
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        
        # SimpleJWT kawaida huweka user_id kwenye payload
        user_id = payload.get("user_id")
        
        if user_id:
            return User.objects.get(id=user_id)
        return AnonymousUser()
    except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
        # Kama token imeisha muda, ni fake, au user hayupo
        return AnonymousUser()

class JWTAuthMiddleware:
    """
    Middleware ya WebSockets inayopokea Token kupitia URL query string.
    Mfano: ws://127.0.0.1:8000/ws/chat/room_name/?token=XYZ...
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # 1. Vuta query string (vitu vinavyofuata baada ya '?')
        query_params = parse_qs(scope["query_string"].decode())
        
        # 2. Tafuta parameter inayoitwa 'token'
        token = query_params.get("token", [None])[0]
        
        # 3. Pata user kutokana na hiyo token
        if token:
            scope["user"] = await get_user(token)
        else:
            scope["user"] = AnonymousUser()
            
        # 4. Endelea na request kwenda kwenye Consumer
        return await self.inner(scope, receive, send)