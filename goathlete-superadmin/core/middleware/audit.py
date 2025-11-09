from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import json

User = get_user_model()

class AuditLog(models.Model):
    """Model to track all critical actions and permission changes"""
    
    ACTION_TYPES = [
        ('auth', 'Authentication'),
        ('permission', 'Permission Change'),
        ('critical', 'Critical Action'),
        ('data', 'Data Modification'),
    ]
    
    timestamp = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    action = models.CharField(max_length=255)
    details = models.JSONField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    status = models.CharField(max_length=50)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['action_type', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.action_type}: {self.action} by {self.user} at {self.timestamp}"

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Only audit non-GET requests and critical actions
        if request.method != 'GET' or self._is_critical_path(request.path):
            self._audit_request(request, response)
        
        return response
    
    def _is_critical_path(self, path):
        critical_paths = [
            '/api/auth/',
            '/api/users/',
            '/api/vendors/',
            '/api/permissions/',
            '/api/bookings/',
            '/api/payments/',
        ]
        return any(path.startswith(cp) for cp in critical_paths)
    
    def _audit_request(self, request, response):
        try:
            user = request.user if request.user.is_authenticated else None
            
            # Determine action type based on path and method
            action_type = self._determine_action_type(request.path, request.method)
            
            # Create audit log entry
            AuditLog.objects.create(
                user=user,
                action_type=action_type,
                action=f"{request.method} {request.path}",
                details={
                    'method': request.method,
                    'path': request.path,
                    'status_code': response.status_code,
                    'query_params': dict(request.GET),
                    'request_body': self._safe_request_body(request),
                },
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status='success' if 200 <= response.status_code < 300 else 'failure'
            )
            
        except Exception as e:
            # Log the error but don't interrupt the request
            import logging
            logging.error(f"Audit logging failed: {str(e)}")
    
    def _determine_action_type(self, path, method):
        if path.startswith('/api/auth/'):
            return 'auth'
        elif path.startswith('/api/permissions/'):
            return 'permission'
        elif method in ['POST', 'PUT', 'DELETE']:
            return 'data'
        return 'critical'
    
    def _safe_request_body(self, request):
        """Get request body while excluding sensitive data"""
        try:
            body = json.loads(request.body)
            # Remove sensitive fields
            sensitive_fields = ['password', 'token', 'credit_card', 'secret']
            for field in sensitive_fields:
                if field in body:
                    body[field] = '[REDACTED]'
            return body
        except:
            return {}
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')