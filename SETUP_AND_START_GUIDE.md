# 🚀 Go-Athlete Application - Setup and Start Guide

This guide will help you set up and start all three applications: Admin, Super Admin, and Vendor App.

## Prerequisites

- Python 3.12+
- Node.js 18+ (for vendor app)
- pip (Python package manager)
- Virtual environment support

## 📋 Step-by-Step Setup

### 1. Admin App Setup (Port 8000)

```bash
# Navigate to admin directory
cd goathlete-admin

# Activate virtual environment (if not already activated)
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional - for Django admin access)
python manage.py createsuperuser

# Start the server
python manage.py runserver 8000
```

**Access URLs:**
- Admin API: http://localhost:8000
- Django Admin: http://localhost:8000/admin/
- API Documentation: http://localhost:8000/api/v1/

### 2. Super Admin App Setup (Port 8001)

```bash
# Navigate to superadmin directory
cd goathlete-superadmin

# Activate virtual environment (if not already activated)
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional - for Django admin access)
python manage.py createsuperuser

# Start the server
python manage.py runserver 8001
```

**Access URLs:**
- Super Admin API: http://localhost:8001
- Django Admin: http://localhost:8001/admin/
- Analytics: http://localhost:8001/analytics/

### 3. Vendor App Setup (React Native/Expo)

```bash
# Navigate to vendor app directory
cd goathlete-vendor/go-athlete-vendor-app

# Install Node.js dependencies (if not already installed)
npm install
# OR
yarn install

# For web mode
npx expo start --web

# For mobile with QR code
npx expo start --clear
```

**Access URLs:**
- Web: http://localhost:19006 (when running in web mode)
- Expo Dev Tools: http://localhost:19002

## 🔧 Configuration

### Environment Variables (Optional)

Both Django apps support environment variables via `.env` files. Create `.env` files in each app directory if needed:

**goathlete-admin/.env:**
```env
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

**goathlete-superadmin/.env:**
```env
DJANGO_SECRET_KEY=superadmin-secret-key-change-in-production
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

**goathlete-vendor/go-athlete-vendor-app/.env:**
```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Default Settings

- **Admin App**: Runs on port 8000, DEBUG=True by default
- **Super Admin App**: Runs on port 8001, DEBUG=True by default
- **Vendor App**: Connects to http://localhost:8000/api/v1 by default

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change the port: `python manage.py runserver 8002`
   - Or kill the process using the port

2. **Database Migration Errors**
   - Delete `db.sqlite3` and run migrations again:
     ```bash
     rm db.sqlite3
     python manage.py migrate
     ```

3. **Module Not Found Errors**
   - Ensure virtual environment is activated
   - Reinstall dependencies: `pip install -r requirements.txt`

4. **CORS Errors**
   - Check that CORS settings allow your origin
   - In development, CORS_ALLOW_ALL_ORIGINS is set to True when DEBUG=True

5. **Static Files Not Loading**
   - Run: `python manage.py collectstatic` (for production)
   - In development, static files are served automatically

### Security Settings

The apps are configured with development-friendly security settings:
- SSL redirect is disabled in development (DEBUG=True)
- Session and CSRF cookies are not secure in development
- CORS allows all origins in development

**⚠️ Important**: Change these settings for production!

## 📱 Testing the Applications

### Admin App
1. Start the server on port 8000
2. Visit http://localhost:8000/admin/ to access Django admin
3. Test API endpoints at http://localhost:8000/api/v1/

### Super Admin App
1. Start the server on port 8001
2. Visit http://localhost:8001/admin/ to access Django admin
3. Test analytics at http://localhost:8001/analytics/

### Vendor App
1. Start Expo: `npx expo start`
2. Scan QR code with Expo Go app (mobile)
3. Or press 'w' for web mode
4. App will connect to Admin API at http://localhost:8000/api/v1

## 🔗 API Endpoints

### Admin App (Port 8000)
- Authentication: `/api/v1/auth/`
- Vendor APIs: `/api/v1/vendor/`
- Admin APIs: `/api/v1/admin/`
- Super Admin APIs: `/api/v1/super-admin/`
- Coach APIs: `/api/v1/vendor/coaches/`
- Ecommerce APIs: `/api/v1/vendor/products/`

### Super Admin App (Port 8001)
- Analytics: `/analytics/`
- API: `/api/`

## 📝 Notes

- All apps use SQLite by default for development
- Switch to PostgreSQL for production
- Make sure all three apps are running for full functionality
- Vendor app requires Admin app to be running for API calls

## ✅ Quick Start Checklist

- [ ] Admin app running on port 8000
- [ ] Super Admin app running on port 8001
- [ ] Vendor app dependencies installed
- [ ] Vendor app can connect to Admin API
- [ ] All migrations applied
- [ ] Superusers created (optional)

---

**Need Help?** Check the individual README files in each app directory for more details.

