from enum import Enum

class UserRole(Enum):
    SUPER_ADMIN = 'super_admin'
    ADMIN = 'admin'
    VENDOR = 'vendor'
    CUSTOMER = 'customer'

# Permission matrix defining access rights for each role
PERMISSION_MATRIX = {
    UserRole.SUPER_ADMIN: {
        'can_manage_admins': True,
        'can_manage_vendors': True,
        'can_manage_customers': True,
        'can_view_analytics': True,
        'can_manage_settings': True,
        'can_manage_roles': True,
        'can_audit_logs': True,
    },
    UserRole.ADMIN: {
        'can_manage_vendors': True,
        'can_manage_customers': True,
        'can_view_analytics': True,
        'can_manage_settings': False,
        'can_manage_roles': False,
        'can_audit_logs': True,
    },
    UserRole.VENDOR: {
        'can_manage_own_profile': True,
        'can_manage_own_services': True,
        'can_view_own_bookings': True,
        'can_view_own_analytics': True,
        'can_manage_own_staff': True,
    },
    UserRole.CUSTOMER: {
        'can_manage_own_profile': True,
        'can_book_services': True,
        'can_view_own_bookings': True,
        'can_rate_services': True,
    }
}

# API endpoint access control
API_ACCESS_CONTROL = {
    'vendor_onboarding': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    'analytics_dashboard': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    'user_management': [UserRole.SUPER_ADMIN],
    'booking_management': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
    'payment_processing': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
}

# Token configuration
TOKEN_CONFIG = {
    'access_token_expiry': 60 * 30,  # 30 minutes
    'refresh_token_expiry': 60 * 60 * 24 * 7,  # 7 days
    'token_rotation_window': 60 * 5,  # 5 minutes before expiry
    'max_refresh_count': 5,  # Maximum number of times a token can be refreshed
}

# Critical actions that require logging
CRITICAL_ACTIONS = [
    'user_role_change',
    'vendor_approval',
    'payment_processing',
    'booking_cancellation',
    'price_change',
    'service_modification',
]