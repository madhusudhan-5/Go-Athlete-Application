# Admin Console

## Overview
This project is a minimal monorepo for a sports facility booking and e-commerce platform. It features a Django REST backend, an Admin Console (built with Django templates and Tailwind CSS, currently being replaced by a React Admin Frontend), and an Expo React Native mobile application for Vendors. The platform aims to streamline operations for sports venues, covering vendor onboarding, court and coach management, booking oversight, product sales, and membership management, alongside robust administrative controls and reporting. The business vision is to provide a comprehensive solution for sports venues to manage their services efficiently and expand their market reach.

## User Preferences
- Minimal setup for fast builds
- Material Design 3 styling (primary: #061A2C, secondary: #D96A23, surface: #FFFFFF, background: #F5F6F7, outline: #AEB4BA)
- Typography: Inter/Poppins fonts, MD3 scale (Display 32, Headline 24, Title 20, Body 14-16, Label 12-14)
- 12dp corner radius, elevation scale 1-5
- Static SVG charts (no heavy chart libraries)
- Pagination at 10 rows per page
- SMS defaults to LOG mode
- No customer app included

## System Architecture

### Backend (Django REST Framework + Admin Console)
- **Framework**: Django 5.x with Django REST Framework.
- **Authentication**: JWT for API, Django sessions for Admin Console.
- **Database**: SQLite (`db.sqlite3`).
- **Admin Console**: Django templates with Tailwind CSS (legacy, being replaced).
- **Key Features**: Vendor onboarding (with KYC), booking management (adjust, cancel, reschedule, refund), support ticketing, user management with permissions, global configuration, offer management, audit logging, reporting, and SMS integration.
- **Modules**: Admin Console (Vendor, Venue, Booking, etc.), Super-Admin (GlobalConfig, Offer, AuditLog), Coach Vertical, Ecommerce, Membership.

### Admin Frontend (React + Material UI)
- **Framework**: Vite + React 19 + Material UI v7.
- **Authentication**: JWT with token refresh.
- **Theme**: MD3 with custom palette (#0A1F35 primary, #DA6F2B secondary), light/dark mode.
- **Features**: Dashboard (KPIs, charts), vendor management (approve/reject/suspend), KYC verification, booking oversight, commission configuration, and settings.
- **Routes**: Prefixed with `/admin/*`.

### Super Admin System (React + Material UI)
- **Framework**: Vite + React 19 + Material UI v7 (same as Admin Frontend).
- **Authentication**: Separate JWT flow (SuperAuthContext).
- **Theme**: Orange accent (#DA6F2B) for distinction.
- **Features**: Platform-wide dashboard, admin user management (9 granular permissions), system configuration, commission override, platform analytics, vendor oversight (force actions), offers management, audit logs, and broadcast messenger.
- **Routes**: Prefixed with `/super/*`.

### Vendor App (Expo React Native)
- **Framework**: Expo (React Native).
- **Styling**: Material Design 3 theme tokens (colors, typography, elevation, shapes).
- **Key Features**: Vendor login, dashboard, calendar-based court booking and slot generation, venue/court management, coach management, product/order management, membership oversight, payout requests, and settings (bank details, KYC uploads).

### System Design Choices
- **Pagination**: Consistent 10 rows per page.
- **Charting**: Static SVG charts to avoid heavy libraries.
- **File Uploads**: Uses `expo-image-picker` and `expo-document-picker` with FormData.
- **SMS**: Defaults to 'LOG' mode for development.
- **Vendor Context**: Manages vendor ID for consistent data access in the Vendor App.

## External Dependencies
- **Twilio**: For SMS notifications (configurable 'LOG' or 'TWILIO' mode).
- **djangorestframework-simplejwt**: For JWT authentication in the API.

## User Credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@sportsplatform.com | SuperAdmin@123 |
| Admin | admin@sportsplatform.com | Admin@123 |
| Vendor | vendor@sportsarena.com | Vendor@123 |

To reset or seed users, run: `cd backend && python manage.py seed_users`

## Local Setup Guide

### Prerequisites
Before starting, ensure you have installed:
- **Python 3.11+** - For the Django backend
- **Node.js 18+** - For the Admin Frontend and Vendor App
- **npm** - Package manager (comes with Node.js)

### Project Structure
```
workspace/
├── backend/              # Django REST API (Port 5000)
├── admin-frontend/       # React Admin Dashboard (Port 5173)
└── vendor-app/           # Expo React Native App (Port 3000)
```

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed initial users (Super Admin, Admin, Vendor)
python manage.py seed_users

# Start the development server
python manage.py runserver 0.0.0.0:5000
```

The backend API will be available at `http://localhost:5000`
- Swagger API Docs: `http://localhost:5000/api/docs/`
- ReDoc: `http://localhost:5000/api/redoc/`

### Step 2: Admin Frontend Setup

Open a new terminal:

```bash
# Navigate to admin frontend directory
cd admin-frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```

The Admin Frontend will be available at `http://localhost:5173`
- Admin Login: `http://localhost:5173/admin/login`
- Super Admin Login: `http://localhost:5173/super/login`

### Step 3: Vendor App Setup

Open a new terminal:

```bash
# Navigate to vendor app directory
cd vendor-app

# Install Node dependencies
npm install

# Start Expo for web
npx expo start --web --port 3000
```

The Vendor App will be available at `http://localhost:3000`

For mobile testing:
- Install **Expo Go** app on your phone
- Scan the QR code shown in the terminal
- The app will load on your mobile device

### Running All Services Together

You need three terminal windows running simultaneously:

| Terminal | Directory | Command | Port |
|----------|-----------|---------|------|
| 1 | backend | `python manage.py runserver 0.0.0.0:5000` | 5000 |
| 2 | admin-frontend | `npm run dev` | 5173 |
| 3 | vendor-app | `npx expo start --web --port 3000` | 3000 |

### Environment Variables

The backend uses these environment variables (set in Replit Secrets):
- `SESSION_SECRET` - Django session secret
- `TWILIO_SID` - Twilio Account SID (optional, for SMS)
- `TWILIO_TOKEN` - Twilio Auth Token (optional, for SMS)
- `TWILIO_FROM` - Twilio phone number (optional, for SMS)

For local development without Twilio, SMS defaults to LOG mode (prints to console).

### Common Issues & Solutions

**Issue: "Module not found" errors**
```bash
# Reinstall dependencies
pip install -r requirements.txt  # For backend
npm install                      # For frontend apps
```

**Issue: Database errors**
```bash
cd backend
python manage.py migrate
python manage.py seed_users
```

**Issue: Port already in use**
```bash
# Find and kill the process using the port
lsof -ti:5000 | xargs kill -9   # For port 5000
lsof -ti:5173 | xargs kill -9   # For port 5173
lsof -ti:3000 | xargs kill -9   # For port 3000
```

**Issue: CORS errors in browser**
The backend is configured to allow all origins. If issues persist, check that the backend is running on port 5000.

### Production Deployment

**Backend (Django):**
```bash
cd backend
pip install gunicorn
gunicorn backend.wsgi:application --bind 0.0.0.0:5000 --workers 4
```

**Admin Frontend (React):**
```bash
cd admin-frontend
npm run build
# Deploy the 'dist' folder to any static hosting (Netlify, Vercel, etc.)
```

**Vendor App (Expo):**
```bash
cd vendor-app
# For web deployment
npx expo export --platform web

# For native app builds (requires Expo EAS)
npx eas build --platform android
npx eas build --platform ios
```

### API Endpoints Reference

**Authentication:**
- `POST /api/auth/login/` - Vendor login
- `POST /api/admin/auth/login/` - Admin login
- `POST /api/super/auth/login/` - Super Admin login

**Admin Dashboard:**
- `GET /api/admin/dashboard/summary/` - Dashboard KPIs
- `GET /api/admin/vendors/` - List vendors
- `GET /api/admin/bookings/` - List bookings

**Super Admin:**
- `GET /api/super/dashboard/` - Platform dashboard
- `GET /api/super/admins/` - Manage admins
- `GET /api/super/config/` - System configuration

**Vendor API:**
- `GET /api/vendor/analytics/` - Vendor analytics
- `GET /api/venues/` - List venues
- `GET /api/courts/` - List courts