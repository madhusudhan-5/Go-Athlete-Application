# API Connection Guide - Frontend to Backend

## Overview
This document describes how the React Native frontend connects to the Django REST Framework backend.

## API Base URL
- **Development**: `http://localhost:8000/api/v1`
- **Production**: Set via `EXPO_PUBLIC_API_URL` environment variable

## Authentication Flow

### 1. Registration
```typescript
POST /api/v1/auth/register/
Body: {
  email: string;
  phone_number?: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'VENDOR' | 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
}
Response: {
  id: string;
  email: string;
  role: string;
  is_verified: boolean;
  message: string;
  otp: string; // Remove in production
}
```

### 2. OTP Verification
```typescript
POST /api/v1/auth/verify_otp/
Body: {
  email: string;
  otp: string;
}
Response: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
    is_verified: boolean;
  }
}
```

### 3. Login (Email/Password)
```typescript
POST /api/v1/auth/login/
Body: {
  email: string;
  password: string;
  '2fa_code'?: string; // If 2FA enabled
}
Response: {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: string;
    vendor_profile?: {...}
  }
}
```

### 4. Get Current User
```typescript
GET /api/v1/auth/me/
Headers: {
  Authorization: 'Bearer <access_token>'
}
Response: {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  avatar_url: string;
  is_verified: boolean;
  is_2fa_enabled: boolean;
  vendor_profile?: {...}
}
```

### 5. Refresh Token
```typescript
POST /api/v1/auth/refresh/
Body: {
  refresh: string; // refresh_token
}
Response: {
  access: string; // new access_token
}
```

### 6. Logout
```typescript
POST /api/v1/auth/logout/
Headers: {
  Authorization: 'Bearer <access_token>'
}
Body: {
  refresh_token: string;
}
```

## Vendor APIs

### Dashboard
```typescript
GET /api/v1/vendor/dashboard/
Headers: {
  Authorization: 'Bearer <access_token>'
}
Response: {
  today_bookings: number;
  today_earnings: number;
  pending_payout: number;
  total_customers: number;
  active_courts: number;
  avg_rating: number;
  occupancy_percentage: number;
  this_month_revenue: number;
  active_offers_count: number;
  active_memberships_count: number;
  quick_actions: Array<{action: string; icon: string; label: string}>
}
```

### Venues
```typescript
GET /api/v1/vendor/venues/
POST /api/v1/vendor/venues/
GET /api/v1/vendor/venues/{id}/
PUT /api/v1/vendor/venues/{id}/
DELETE /api/v1/vendor/venues/{id}/
```

### Courts
```typescript
GET /api/v1/vendor/courts/
POST /api/v1/vendor/courts/
GET /api/v1/vendor/courts/{id}/
PUT /api/v1/vendor/courts/{id}/
DELETE /api/v1/vendor/courts/{id}/
POST /api/v1/vendor/courts/{id}/availability/
POST /api/v1/vendor/courts/{id}/slots/generate/
PUT /api/v1/vendor/courts/{id}/pricing/
```

### Bookings
```typescript
GET /api/v1/vendor/bookings/?date=YYYY-MM-DD&status=CONFIRMED&court_id=uuid
POST /api/v1/vendor/bookings/
GET /api/v1/vendor/bookings/{id}/
PUT /api/v1/vendor/bookings/{id}/reschedule/
POST /api/v1/vendor/bookings/{id}/cancel/
```

### Offers
```typescript
GET /api/v1/vendor/offers/
GET /api/v1/vendor/offers/{id}/
```

### Analytics
```typescript
GET /api/v1/vendor/analytics/?metric=bookings&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&groupby=daily
GET /api/v1/vendor/financial/summary/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&period=MONTHLY
```

## Frontend Implementation

### API Service (`services/api.ts`)
- Base URL: `process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1'`
- Token storage: `AsyncStorage` (`auth_token`, `refresh_token`)
- Automatic token injection in headers
- Error handling and token refresh logic

### Auth Hook (`hooks/useAuth.tsx`)
- Manages authentication state
- Handles login/logout
- Auto-navigation based on user role
- Token refresh on app start

### Vendor API Service (`services/vendorApi.ts`)
- Vendor-specific API calls
- Dashboard stats
- Venue/Court management
- Booking operations
- Analytics and financial data

## Token Management

1. **Storage**: Tokens stored in `AsyncStorage`
   - `auth_token`: Access token (1 hour expiry)
   - `refresh_token`: Refresh token (30 days expiry)

2. **Refresh Logic**: 
   - On 401 response, attempt token refresh
   - If refresh fails, redirect to login

3. **Headers**: All authenticated requests include:
   ```
   Authorization: Bearer <access_token>
   ```

## Error Handling

- Network errors: Show user-friendly messages
- 401 Unauthorized: Attempt token refresh, then logout if fails
- 403 Forbidden: Show permission error
- 400 Bad Request: Show validation errors
- 500 Server Error: Show generic error message

## CORS Configuration

Backend CORS settings allow:
- `http://localhost:3000` (React web)
- `http://localhost:8081` (Expo default)
- `exp://localhost:8081` (Expo)
- All origins in DEBUG mode (for development)

## Testing

1. Start Django server:
   ```bash
   cd goathlete-admin
   python manage.py runserver
   ```

2. Start Expo app:
   ```bash
   cd goathlete-vendor/go-athlete-vendor-app
   npm start
   ```

3. Test endpoints using:
   - Postman/Insomnia
   - React Native Debugger
   - Expo DevTools

## Next Steps

1. Implement token refresh interceptor
2. Add request/response logging
3. Implement offline support
4. Add request retry logic
5. Implement proper error boundaries

