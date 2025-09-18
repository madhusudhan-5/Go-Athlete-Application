# Go Athlete Vendor - Authentication System

This document provides a comprehensive guide to the authentication system implemented for the Go Athlete Vendor application.

## 🏗️ Architecture Overview

The authentication system consists of:

1. **React Native Frontend** - Mobile app with Google/Apple login and OTP verification
2. **FastAPI Backend** - REST API with PostgreSQL database
3. **JWT Authentication** - Token-based authentication
4. **OTP System** - Email-based verification for phone/email login

## 📱 Frontend Features

### Authentication Methods
- **Email + OTP**: Traditional email-based authentication with 6-digit OTP
- **Google Sign-In**: OAuth2 integration with Google
- **Apple Sign-In**: Native Apple authentication (iOS only)

### User Flow
1. User enters email or chooses social login
2. For email: OTP is sent and verified
3. For social login: Direct authentication with provider
4. Backend determines if user is new or existing
5. New users → Onboarding flow
6. Existing users → Dashboard

### Key Components
- `login.tsx` - Main login screen with all authentication options
- `otp-verification.tsx` - Modern card-based OTP verification screen
- `api.ts` - Centralized API service for backend communication
- `OnboardingScreen.tsx` - Welcome flow for new users

## 🔧 Backend Features

### API Endpoints
- `POST /auth/send-otp` - Send OTP to email
- `POST /auth/verify-otp` - Verify OTP and authenticate
- `POST /auth/social-login` - Google/Apple authentication
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout user

### Database Schema
- **Users Table**: Stores user information and authentication details
- **OTPs Table**: Manages OTP codes with expiration

### Security Features
- JWT token-based authentication
- OTP expiration (10 minutes)
- Email validation
- Secure password handling for social logins

## 🚀 Setup Instructions

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd goathlete-vendor-backend
   ```

2. **Run setup script**:
   ```bash
   python setup.py
   ```

3. **Manual setup (alternative)**:
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```
till here done 
4. **Configure environment**:
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

5. **Set up PostgreSQL database**:
   - Install PostgreSQL
   - Create database: `goathlete`
   - Update `DATABASE_URL` in `.env`

6. **Run the backend**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to app directory**:
   ```bash
   cd goathlete-vendor/go-athlete-vendor-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Google/Apple authentication**:
   - Update `GOOGLE_CLIENT_IDS` in `login.tsx`
   - Configure Apple Sign-In in your Apple Developer account

4. **Update API base URL**:
   - Edit `services/api.ts`
   - Update `API_BASE_URL` to match your backend

5. **Run the app**:
   ```bash
   npm start
   # or
   yarn start
   ```

## 🔐 Environment Configuration

### Backend (.env)
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/goathlete_vendor

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# SMTP Configuration for OTP emails
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Environment
ENVIRONMENT=development
```

### Frontend Configuration
Update the following in your app:

1. **Google OAuth Client IDs** in `login.tsx`:
   ```typescript
   const GOOGLE_CLIENT_IDS = {
     webClientId: 'YOUR_WEB_CLIENT_ID',
     iosClientId: 'YOUR_IOS_CLIENT_ID',
     androidClientId: 'YOUR_ANDROID_CLIENT_ID',
   };
   ```

2. **API Base URL** in `services/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://localhost:8000'; // or your backend URL
   ```

## 📊 API Usage Examples

### Send OTP
```bash
curl -X POST "http://localhost:8000/auth/send-otp" \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com"}'
```

### Verify OTP
```bash
curl -X POST "http://localhost:8000/auth/verify-otp" \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "otp_code": "123456"}'
```

### Social Login
```bash
curl -X POST "http://localhost:8000/auth/social-login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@gmail.com",
       "name": "John Doe",
       "provider_id": "google_user_id",
       "auth_provider": "google"
     }'
```

## 🎨 UI/UX Features

### OTP Verification Screen
- Modern card-based design
- 6-digit OTP input with auto-focus
- Timer countdown for resend
- Smooth animations and transitions
- Responsive design for all screen sizes

### Login Screen
- Clean, modern interface
- Social login buttons with proper branding
- Email validation
- Loading states and error handling
- Accessibility features

## 🔒 Security Considerations

1. **JWT Tokens**: Secure token generation and validation
2. **OTP Expiration**: 10-minute expiration for security
3. **Email Validation**: Proper email format validation
4. **Rate Limiting**: Consider implementing rate limiting for OTP requests
5. **HTTPS**: Use HTTPS in production
6. **Environment Variables**: Never commit sensitive data

## 🧪 Testing

### Backend Testing
```bash
# Run backend tests
pytest

# Test API endpoints
curl http://localhost:8000/docs  # Swagger UI
```

### Frontend Testing
```bash
# Run React Native tests
npm test

# Test on device/simulator
npm run ios
npm run android
```

## 🚀 Deployment

### Backend Deployment
1. Set up production database
2. Configure environment variables
3. Use a production WSGI server (e.g., Gunicorn)
4. Set up reverse proxy (Nginx)
5. Enable HTTPS

### Frontend Deployment
1. Build for production
2. Deploy to app stores (iOS App Store, Google Play)
3. Configure production API endpoints

## 📝 Development Notes

- The system automatically detects new vs existing users
- OTP codes are 6 digits and expire in 10 minutes
- Social login providers are Google and Apple
- All API calls are centralized in the `api.ts` service
- Error handling is implemented throughout the flow
- Loading states provide good user experience

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Ensure database exists

2. **OTP Not Sending**:
   - Check SMTP configuration
   - Verify email credentials
   - Check spam folder

3. **Social Login Issues**:
   - Verify client IDs are correct
   - Check OAuth configuration
   - Ensure proper redirect URLs

4. **API Connection Issues**:
   - Verify backend is running
   - Check API_BASE_URL in frontend
   - Ensure CORS is configured

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation at `/docs`
3. Check console logs for detailed error messages
4. Verify all environment variables are set correctly
