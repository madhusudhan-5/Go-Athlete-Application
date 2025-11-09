from django.conf import settings
from django.http import HttpResponseForbidden
from django.utils.deprecation import MiddlewareMixin
from jwt.exceptions import InvalidTokenError
import jwt
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)

class SecurityMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # CSRF protection for non-GET methods
        if request.method not in ['GET', 'HEAD', 'OPTIONS'] and not self._valid_csrf(request):
            return HttpResponseForbidden('CSRF token missing or incorrect')
            
        # JWT validation
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
                payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
                
                # Check token expiry
                if datetime.fromtimestamp(payload['exp']) < datetime.now():
                    return HttpResponseForbidden('Token expired')
                    
                # Attach user role to request
                request.user_role = payload.get('role')
                
                # Log critical actions
                if request.method in ['POST', 'PUT', 'DELETE']:
                    logger.info(f"Critical action: {request.method} {request.path} by {payload.get('sub')} with role {payload.get('role')}")
                
            except InvalidTokenError:
                return HttpResponseForbidden('Invalid token')
                
    def _valid_csrf(self, request):
        # Custom CSRF validation
        csrf_token = request.headers.get('X-CSRF-Token')
        return csrf_token and csrf_token == request.session.get('csrf_token')

class RoleBasedAccessMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        if not hasattr(view_func, 'allowed_roles'):
            return None
            
        user_role = getattr(request, 'user_role', None)
        if user_role not in view_func.allowed_roles:
            return HttpResponseForbidden('Insufficient permissions')

def allowed_roles(roles):
    """Decorator to specify allowed roles for views"""
    def decorator(view_func):
        view_func.allowed_roles = roles
        return view_func
    return decorator