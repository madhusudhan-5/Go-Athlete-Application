# Setup Guide - Next Steps

## ✅ Completed Configuration

1. ✅ Updated `settings.py` with new apps
2. ✅ Added JWT authentication configuration
3. ✅ Added Razorpay configuration
4. ✅ Created main `urls.py` with booking API routes
5. ✅ All models created and ready

## 📋 Steps to Complete Setup

### Step 1: Install Dependencies

```bash
cd goathlete-admin
pip install -r requirements.txt
```

**Note:** If you haven't already, make sure these are in `requirements.txt`:
- `djangorestframework-simplejwt>=5.3.0`
- `razorpay>=1.4.0`

### Step 2: Create Database Migrations

```bash
# Create migrations for all new apps
python manage.py makemigrations venues
python manage.py makemigrations bookings
python manage.py makemigrations coaches
python manage.py makemigrations memberships

# Also create migrations for updated models
python manage.py makemigrations accounts
python manage.py makemigrations core
```

### Step 3: Apply Migrations

```bash
python manage.py migrate
```

### Step 4: Verify Setup

```bash
# Check for any migration issues
python manage.py showmigrations

# Run Django checks
python manage.py check
```

### Step 5: Create Superuser (if needed)

```bash
python manage.py createsuperuser
```

### Step 6: Test API Endpoints

Start the development server:

```bash
python manage.py runserver
```

Test the booking API:

```bash
# List bookings (requires authentication)
curl -X GET http://localhost:8000/api/v1/vendor/bookings/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create a booking (requires authentication and vendor setup)
curl -X POST http://localhost:8000/api/v1/vendor/bookings/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "court_id": "court-uuid",
    "customer_phone": "+919876543210",
    "date": "2025-01-20",
    "start_time": "10:00",
    "end_time": "11:00",
    "payment_method": "ONLINE"
  }'
```

## 🔧 Configuration Files Updated

### `settings.py` Changes:
- ✅ Added new apps to `INSTALLED_APPS`:
  - `venues.apps.VenuesConfig`
  - `bookings.apps.BookingsConfig`
  - `coaches.apps.CoachesConfig`
  - `memberships.apps.MembershipsConfig`
- ✅ Added JWT authentication to REST_FRAMEWORK
- ✅ Added pagination settings
- ✅ Added JWT configuration (SIMPLE_JWT)
- ✅ Added Razorpay configuration

### `urls.py` Created:
- ✅ Main URL configuration
- ✅ Booking API routes: `/api/v1/vendor/bookings/`

## 📝 Environment Variables Needed

Create a `.env` file in `goathlete-admin/` directory:

```env
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=goathlete_admin
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Razorpay (get from Razorpay dashboard)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# CORS (for React Native app)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 🚨 Common Issues & Solutions

### Issue 1: "No module named 'venues'"
**Solution:** Make sure you've added the apps to `INSTALLED_APPS` in `settings.py`

### Issue 2: "Circular import" errors
**Solution:** Check that all model imports use string references (e.g., `'core.VendorProfile'`)

### Issue 3: "Field doesn't have a default value"
**Solution:** Make sure all required fields have defaults or are nullable where appropriate

### Issue 4: Migration conflicts
**Solution:** 
```bash
# Delete migration files (except __init__.py) and recreate
python manage.py makemigrations --empty app_name
python manage.py makemigrations
```

## 📚 Next Implementation Steps

After migrations are complete:

1. **Create Authentication APIs** (Part 2.1)
   - Register, login, OTP, 2FA, refresh endpoints

2. **Create Vendor Dashboard API** (Part 2.4)
   - Dashboard stats endpoint
   - Venue/Court management endpoints

3. **Create Razorpay Integration**
   - Payment initialization
   - Webhook handlers

4. **Create Admin APIs** (Part 2.2, 2.3)
   - Super Admin endpoints
   - Admin endpoints

5. **Test End-to-End**
   - Create test data
   - Test booking flow
   - Test payment flow

## ✅ Verification Checklist

- [ ] All migrations created successfully
- [ ] All migrations applied successfully
- [ ] Django checks pass (`python manage.py check`)
- [ ] Server starts without errors
- [ ] API endpoints are accessible
- [ ] Database tables created correctly
- [ ] Admin interface works

## 🎯 Quick Test Script

After setup, you can test with this Python script:

```python
# test_setup.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'goathlete_admin.settings')
django.setup()

from venues.models import Venue, Court
from bookings.models import Booking
from core.models import VendorProfile

# Check models are accessible
print("✅ Venue model:", Venue)
print("✅ Court model:", Court)
print("✅ Booking model:", Booking)
print("✅ VendorProfile model:", VendorProfile)
print("\n✅ All models loaded successfully!")
```

Run with: `python manage.py shell < test_setup.py`

---

**Status**: ✅ Configuration Complete | Ready for Migrations  
**Next**: Run migrations and test API endpoints

