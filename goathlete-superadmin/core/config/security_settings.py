"""
Security settings for Go-Athlete Application
"""

import secrets
from datetime import timedelta

# JWT Settings
JWT_SETTINGS = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': secrets.token_urlsafe(32),
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Session Security
SESSION_SETTINGS = {
    'SESSION_COOKIE_SECURE': True,
    'SESSION_COOKIE_HTTPONLY': True,
    'SESSION_COOKIE_SAMESITE': 'Strict',
    'SESSION_COOKIE_AGE': 1800,  # 30 minutes
    'SESSION_EXPIRE_AT_BROWSER_CLOSE': True,
}

# CSRF Protection
CSRF_SETTINGS = {
    'CSRF_COOKIE_SECURE': True,
    'CSRF_COOKIE_HTTPONLY': True,
    'CSRF_COOKIE_SAMESITE': 'Strict',
    'CSRF_TRUSTED_ORIGINS': ['https://*.goathlete.com'],
}

# Password Policy
PASSWORD_POLICY = {
    'MIN_LENGTH': 12,
    'REQUIRE_UPPERCASE': True,
    'REQUIRE_LOWERCASE': True,
    'REQUIRE_NUMBERS': True,
    'REQUIRE_SPECIAL_CHARS': True,
    'PASSWORD_HISTORY': 5,
    'MAX_PASSWORD_AGE': 90,  # days
}

# API Rate Limiting
RATE_LIMITING = {
    'DEFAULT': '100/hour',
    'LOGIN': '5/minute',
    'REGISTER': '3/hour',
    'PASSWORD_RESET': '3/hour',
}

# Security Headers
SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
}

# Audit Trail
AUDIT_SETTINGS = {
    'ENABLED': True,
    'LOG_LEVEL': 'INFO',
    'RETENTION_PERIOD': 365,  # days
    'EXCLUDE_PATHS': [
        '/api/health/',
        '/api/metrics/',
    ],
}

# IP Filtering
IP_SECURITY = {
    'ADMIN_PANEL_IP_WHITELIST': [
        '10.0.0.0/8',  # Internal network
        '192.168.0.0/16',  # VPN network
    ],
    'API_IP_BLACKLIST': [],
}

# OAuth Settings
OAUTH_SETTINGS = {
    'ALLOWED_DOMAINS': ['goathlete.com'],
    'GOOGLE_CLIENT_ID': '',
    'GOOGLE_CLIENT_SECRET': '',
    'FACEBOOK_APP_ID': '',
    'FACEBOOK_APP_SECRET': '',
}

# Mobile App Security
MOBILE_SECURITY = {
    'APP_SIGNATURE_VALIDATION': True,
    'CERTIFICATE_PINNING': True,
    'MINIMUM_APP_VERSION': {
        'ios': '1.0.0',
        'android': '1.0.0',
    },
    'FORCE_UPDATE_VERSIONS': {
        'ios': [],
        'android': [],
    },
}

# Vendor API Security
VENDOR_API_SECURITY = {
    'REQUIRE_HMAC': True,
    'HMAC_ALGORITHM': 'SHA256',
    'TOKEN_ROTATION_PERIOD': 7,  # days
    'RATE_LIMIT': '1000/hour',
    'IP_WHITELIST_ENABLED': True,
}