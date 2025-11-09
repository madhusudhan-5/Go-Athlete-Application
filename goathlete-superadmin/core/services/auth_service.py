from django.conf import settings
from datetime import datetime, timedelta
import jwt
import secrets
from .permissions import TOKEN_CONFIG, CRITICAL_ACTIONS, UserRole
import logging
from typing import Optional, Tuple, Dict

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    def generate_tokens(user_id: int, role: str) -> Tuple[str, str]:
        """Generate access and refresh tokens"""
        access_token = jwt.encode(
            {
                'sub': user_id,
                'role': role,
                'exp': datetime.utcnow() + timedelta(seconds=TOKEN_CONFIG['access_token_expiry']),
                'iat': datetime.utcnow(),
                'jti': secrets.token_urlsafe(32)
            },
            settings.JWT_SECRET_KEY,
            algorithm='HS256'
        )
        
        refresh_token = jwt.encode(
            {
                'sub': user_id,
                'exp': datetime.utcnow() + timedelta(seconds=TOKEN_CONFIG['refresh_token_expiry']),
                'iat': datetime.utcnow(),
                'jti': secrets.token_urlsafe(32),
                'refresh_count': 0
            },
            settings.JWT_REFRESH_SECRET_KEY,
            algorithm='HS256'
        )
        
        return access_token, refresh_token
    
    @staticmethod
    def validate_token(token: str, is_refresh: bool = False) -> Optional[Dict]:
        """Validate JWT token and return payload if valid"""
        try:
            secret = settings.JWT_REFRESH_SECRET_KEY if is_refresh else settings.JWT_SECRET_KEY
            payload = jwt.decode(token, secret, algorithms=['HS256'])
            
            # Check refresh count for refresh tokens
            if is_refresh and payload.get('refresh_count', 0) >= TOKEN_CONFIG['max_refresh_count']:
                return None
                
            return payload
        except jwt.InvalidTokenError:
            return None
    
    @staticmethod
    def refresh_tokens(refresh_token: str) -> Optional[Tuple[str, str]]:
        """Generate new token pair from refresh token"""
        payload = AuthService.validate_token(refresh_token, is_refresh=True)
        if not payload:
            return None
            
        # Generate new tokens with incremented refresh count
        new_access_token, new_refresh_token = AuthService.generate_tokens(
            payload['sub'],
            payload.get('role', '')
        )
        
        return new_access_token, new_refresh_token
    
    @staticmethod
    def has_permission(user_role: str, action: str) -> bool:
        """Check if user has permission for specific action"""
        try:
            role = UserRole(user_role)
            permissions = settings.PERMISSION_MATRIX.get(role, {})
            return permissions.get(action, False)
        except ValueError:
            return False
    
    @staticmethod
    def log_critical_action(action: str, user_id: int, details: Dict) -> None:
        """Log critical security actions"""
        if action in CRITICAL_ACTIONS:
            logger.warning(
                f"Critical action performed: {action}",
                extra={
                    'user_id': user_id,
                    'action': action,
                    'details': details,
                    'timestamp': datetime.utcnow().isoformat()
                }
            )