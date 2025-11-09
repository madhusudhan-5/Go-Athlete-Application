# Go-Athlete Implementation Guide

## ✅ Completed Components

### 1. User Model (`accounts/models.py`)
- ✅ UUID primary key
- ✅ VENDOR and CUSTOMER roles added
- ✅ Phone number with E.164 validation
- ✅ Avatar URL, is_verified, 2FA support
- ✅ Login attempts and account locking (5 attempts = 30 min lock)
- ✅ Audit fields (created_by, updated_by)
- ✅ Metadata JSON field for device info/preferences
- ✅ Helper methods: `is_locked()`, `increment_login_attempts()`, `reset_login_attempts()`

### 2. Audit & Security Models (`accounts/models.py`)
- ✅ **AuditLog**: Comprehensive audit logging with action types, entity tracking, old/new values
- ✅ **LoginAttempt**: Security tracking for all login attempts
- ✅ **ActivityLog**: Legacy model kept for backward compatibility

### 3. Core Models (`core/models.py`)
- ✅ **AdminHierarchy**: Super Admin to Admin relationships with permissions
- ✅ **CommissionConfig**: Comprehensive commission configuration with category overrides, vendor custom rates, payout cycles
- ✅ **Offer**: Complete offer model with:
  - Visibility percentage (top X% filtering)
  - Usage limits (total and per customer)
  - Customer inclusion/exclusion lists
  - Time-based applicability (date, time, days of week)
  - Revenue impact tracking
  - Soft delete support
- ✅ **VendorProfile**: Comprehensive vendor model with:
  - All vendor types (VENUE, COACH, ECOMMERCE, HYBRID)
  - Complete KYC workflow (PENDING, VERIFIED, REJECTED)
  - Bank details with account encryption support
  - PAN and GSTIN validation
  - Approval workflow (PENDING, APPROVED, REJECTED, SUSPENDED)
  - Commission and payout configuration
  - Analytics fields (denormalized)
  - Soft delete support

## 🔄 Remaining Work

### Phase 1: Complete Database Models

#### 1. Venue & Court Models (High Priority)
**File**: Create `goathlete-admin/venues/models.py` or add to `core/models.py`

**Models Needed**:
- `Venue`: Venue information, amenities, operating hours, location
- `Court`: Court details, pricing, capacity, equipment
- `CourtAvailability`: Weekly availability schedule
- `TimeSlot`: Bookable time slots with status (AVAILABLE, BOOKED, BLOCKED, MAINTENANCE)

**Key Fields**:
- Venue: name, address, latitude/longitude, amenities (JSON array), opening/closing times, holiday dates
- Court: venue FK, name, court_type enum, base_price_per_hour, capacity, lights_available, equipment_available
- CourtAvailability: court FK, day_of_week (0-6), start_time, end_time, is_available
- TimeSlot: court FK, date, start_time, end_time, duration_minutes, base_price, status, booked_by (FK to Booking)

#### 2. Coach Models (High Priority)
**File**: Create `goathlete-admin/coaches/models.py` or add to `core/models.py`

**Models Needed**:
- `Coach`: Coach profile, specializations, certifications, rates
- `CoachAvailability`: Weekly availability
- `CoachPackage`: Bundled session packages

**Key Fields**:
- Coach: vendor FK, user FK, specializations (JSON), certifications (JSON), hourly_rate, verification_status
- CoachAvailability: coach FK, day_of_week, start_time, end_time, recurring, lead_time_hours
- CoachPackage: coach FK, name, sessions_count, total_price, validity_days, discount_percentage

#### 3. Booking & Transaction Models (High Priority)
**File**: Create `goathlete-admin/bookings/models.py` or add to `core/models.py`

**Models Needed**:
- `Booking`: Venue/court bookings with pricing breakdown
- `CoachingSession`: Coaching session bookings
- `Order`: Ecommerce orders

**Key Fields**:
- Booking: court FK, customer_user FK, date, start_time, end_time, base_price, discount_amount, applied_offer FK, tax_amount, commission_amount, vendor_payout, payment_status, booking_status, payment_id (Razorpay)
- CoachingSession: Similar to Booking but for coaching with delivery_mode, meeting_link, attendance_status
- Order: vendor FK, customer_user FK, order_number, items (JSON), subtotal, shipping_cost, tax_amount, commission_amount, order_status, tracking_number

#### 4. Ecommerce Models (Medium Priority)
**File**: Create `goathlete-admin/ecommerce/models.py` or add to `core/models.py`

**Models Needed**:
- `EcommerceVendor`: Ecommerce shop details
- `Product`: Product catalog
- `ProductVariant`: Product variants (size, color, etc.)

#### 5. Membership Models (Medium Priority)
**File**: Add to `core/models.py`

**Models Needed**:
- `Membership`: Membership plans (SESSION_BASED, CREDIT_BASED, UNLIMITED, TIME_BASED)
- `CustomerMembership`: Active customer memberships

### Phase 2: API Endpoints (Django REST Framework)

#### 1. Authentication APIs (`api/v1/auth/`)
**File**: Create `goathlete-admin/api/views/auth.py`

**Endpoints**:
- `POST /api/v1/auth/register/` - User registration with OTP
- `POST /api/v1/auth/verify-otp/` - OTP verification, returns JWT tokens
- `POST /api/v1/auth/login/` - Login with email/password, optional 2FA
- `POST /api/v1/auth/refresh/` - Refresh access token
- `POST /api/v1/auth/logout/` - Logout, invalidate tokens
- `POST /api/v1/auth/setup-2fa/` - Setup 2FA, returns QR code
- `GET /api/v1/auth/me/` - Get current user profile

**Implementation Notes**:
- Use JWT tokens (access: 1 hour, refresh: 30 days)
- Implement rate limiting (5 failed attempts = 30 min lock)
- Use `djangorestframework-simplejwt` for JWT
- Store tokens securely (HttpOnly cookies for web, Keychain/Keystore for mobile)

#### 2. Super Admin APIs (`api/v1/super-admin/`)
**File**: Create `goathlete-admin/api/views/super_admin.py`

**Endpoints**:
- `GET/POST /api/v1/super-admin/admins/` - List/create admins
- `GET/POST /api/v1/super-admin/offers/` - List/create offers
- `PUT /api/v1/super-admin/offers/{id}/` - Update offer
- `GET/PUT /api/v1/super-admin/commission-config/` - Get/update commission config
- `GET /api/v1/super-admin/analytics/` - Analytics dashboard
- `GET /api/v1/super-admin/audit-logs/` - Audit log viewer

**Permissions**: Only SUPER_ADMIN role

#### 3. Admin APIs (`api/v1/admin/`)
**File**: Create `goathlete-admin/api/views/admin.py`

**Endpoints**:
- `GET /api/v1/admin/vendors/` - List vendors (filtered by admin's vendor_access)
- `PUT /api/v1/admin/vendors/{id}/approve/` - Approve vendor
- `PUT /api/v1/admin/vendors/{id}/reject/` - Reject vendor
- `GET /api/v1/admin/customers/` - List customers
- `POST /api/v1/admin/vendors/onboard/` - Onboard new vendor

**Permissions**: ADMIN role, check AdminHierarchy for vendor_access

#### 4. Vendor APIs (`api/v1/vendor/`)
**File**: Create `goathlete-admin/api/views/vendor.py`

**Endpoints**:
- `GET /api/v1/vendor/dashboard/` - Dashboard stats
- `POST /api/v1/vendor/venues/` - Create venue
- `POST /api/v1/vendor/courts/` - Create court
- `POST /api/v1/vendor/courts/{id}/availability/` - Set court availability
- `POST /api/v1/vendor/courts/{id}/slots/generate/` - Generate time slots
- `GET /api/v1/vendor/bookings/` - List bookings
- `GET /api/v1/vendor/bookings/{id}/` - Booking detail
- `PUT /api/v1/vendor/bookings/{id}/reschedule/` - Reschedule booking
- `POST /api/v1/vendor/bookings/{id}/cancel/` - Cancel booking
- `GET /api/v1/vendor/customers/` - List customers
- `GET /api/v1/vendor/financial/summary/` - Financial summary
- `GET /api/v1/vendor/analytics/` - Analytics

**Permissions**: VENDOR role, only own data

#### 5. Payment Webhook (`api/v1/webhooks/razorpay/`)
**File**: Create `goathlete-admin/api/views/webhooks.py`

**Endpoints**:
- `POST /api/v1/webhooks/razorpay/payment_success/` - Razorpay payment success webhook
- `POST /api/v1/webhooks/razorpay/payment_failed/` - Razorpay payment failed webhook

**Implementation Notes**:
- Verify Razorpay signature
- Update booking/order payment status
- Trigger refunds if needed
- Send notifications

### Phase 3: Business Logic

#### 1. Offer Application Logic
**File**: Create `goathlete-admin/core/services/offer_service.py`

**Functions**:
- `get_applicable_offers(customer, category, amount, date, time)` - Get applicable offers
- `apply_offer(offer, base_price)` - Calculate discount
- `check_offer_eligibility(offer, customer)` - Check if customer eligible
- `filter_by_visibility_percentage(offers, percentage)` - Filter top X%

**Logic**:
1. Get all active offers for category
2. Check validity (date, time, day_of_week)
3. Check customer eligibility (new customer, not excluded, usage limit)
4. Filter by visibility_percentage
5. Sort by discount_value (highest first)
6. Return top offers

#### 2. Commission Calculation
**File**: Create `goathlete-admin/core/services/commission_service.py`

**Functions**:
- `calculate_commission(booking, vendor)` - Calculate commission for booking
- `get_commission_rate(vendor, category)` - Get commission rate (check overrides)
- `calculate_payout(booking)` - Calculate vendor payout

**Logic**:
1. Get CommissionConfig
2. Check category_overrides
3. Check vendor_custom_rates
4. Calculate commission_amount = total_amount * (rate / 100)
5. Calculate vendor_payout = total_amount - commission_amount

#### 3. Payout Processing
**File**: Create `goathlete-admin/core/services/payout_service.py`

**Functions**:
- `process_payouts(cycle='WEEKLY')` - Process payouts for cycle
- `create_payout(vendor, amount)` - Create payout record
- `transfer_to_vendor(payout)` - Transfer via Razorpay/payment provider

**Logic**:
1. Aggregate pending transactions per vendor
2. If amount >= minimum_payout_threshold:
   - Create Payout record
   - Transfer to vendor bank account
   - Mark transactions as PROCESSED
   - Send email notification

### Phase 4: Mobile App (React Native/Expo)

#### 1. Calendar Screen (`app/dashboard/calendar.tsx`)
**Features**:
- Day/Week view toggle
- Venue and court selector
- Time slot grid (06:00 - 22:00)
- Color-coded slots (available, booked, blocked)
- Tap slot to create/view booking
- FAB for quick booking creation

#### 2. Booking Detail Screen (`app/dashboard/bookings/[id].tsx`)
**Features**:
- Customer info card
- Booking summary (court, date, time)
- Pricing breakdown (base, discount, tax, commission, payout)
- Payment details
- Status and actions (reschedule, cancel, check-in)
- Internal notes
- Customer notes

#### 3. Venue Registration (`app/dashboard/venue-registration.tsx`)
**Multi-step form**:
- Step 1: Venue basics (name, address, location)
- Step 2: Operating hours
- Step 3: Amenities & images
- Step 4: Review & submit

#### 4. Court Registration (`app/dashboard/court-registration.tsx`)
**Multi-step form**:
- Step 1: Court details (name, type, price, capacity)
- Step 2: Images
- Step 3: Availability (weekly schedule)
- Step 4: Review & submit

#### 5. Financial Summary (`app/dashboard/financial.tsx`)
**Features**:
- Period selector (This Month, Last Month, Custom)
- Summary cards (revenue, commission, payout)
- Breakdown by service
- Daily breakdown chart
- Payout history
- Export statement button

## 📋 Implementation Checklist

### Backend
- [ ] Create Venue, Court, CourtAvailability, TimeSlot models
- [ ] Create Coach, CoachAvailability, CoachPackage models
- [ ] Create Booking, CoachingSession, Order models
- [ ] Create EcommerceVendor, Product, ProductVariant models
- [ ] Create Membership, CustomerMembership models
- [ ] Create API serializers for all models
- [ ] Create authentication API endpoints
- [ ] Create Super Admin API endpoints
- [ ] Create Admin API endpoints
- [ ] Create Vendor API endpoints
- [ ] Create Coach API endpoints
- [ ] Create Ecommerce API endpoints
- [ ] Implement Razorpay payment integration
- [ ] Implement payment webhooks
- [ ] Implement offer application logic
- [ ] Implement commission calculation
- [ ] Implement payout processing
- [ ] Add API authentication middleware (JWT)
- [ ] Add role-based access control middleware
- [ ] Add rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)

### Mobile App
- [ ] Complete Calendar screen
- [ ] Complete Booking detail screen
- [ ] Complete Venue registration flow
- [ ] Complete Court registration flow
- [ ] Complete Customer management screens
- [ ] Complete Financial summary screen
- [ ] Complete Analytics screen
- [ ] Complete Membership management screens
- [ ] Connect all screens to API endpoints
- [ ] Add error handling and loading states
- [ ] Add offline support (if needed)
- [ ] Add push notifications

### Testing
- [ ] Unit tests for models
- [ ] Unit tests for services
- [ ] API endpoint tests
- [ ] Integration tests
- [ ] Mobile app E2E tests
- [ ] Security testing (SQL injection, XSS, CSRF)
- [ ] Performance testing

### Deployment
- [ ] Database migrations
- [ ] Environment configuration
- [ ] SSL certificates
- [ ] CI/CD pipeline
- [ ] Monitoring and logging (Sentry, DataDog)
- [ ] Backup strategy

## 🔧 Technical Notes

### Database Migrations
After creating/updating models, run:
```bash
python manage.py makemigrations
python manage.py migrate
```

### JWT Configuration
Add to `settings.py`:
```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
}
```

### Razorpay Configuration
Add to `settings.py`:
```python
RAZORPAY_KEY_ID = env('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = env('RAZORPAY_KEY_SECRET')
```

### API URL Configuration
Create `goathlete-admin/api/urls.py`:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# Register viewsets here

urlpatterns = [
    path('v1/', include(router.urls)),
    path('v1/auth/', include('api.views.auth')),
    path('v1/super-admin/', include('api.views.super_admin')),
    path('v1/admin/', include('api.views.admin')),
    path('v1/vendor/', include('api.views.vendor')),
    path('v1/webhooks/razorpay/', include('api.views.webhooks')),
]
```

## 📚 Resources

- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Razorpay Integration](https://razorpay.com/docs/api/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

## 🚀 Next Steps

1. **Start with Venue/Court models** - These are foundational for the booking system
2. **Create Booking model** - Core transaction model
3. **Implement authentication APIs** - Required for all other APIs
4. **Build vendor dashboard API** - Most critical for vendor app
5. **Complete mobile app screens** - Connect to APIs as they're built

---

**Last Updated**: 2025-01-15
**Status**: Foundation complete, ready for Phase 1 implementation

