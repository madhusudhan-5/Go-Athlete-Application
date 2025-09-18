# Go Athlete Vendor Backend

FastAPI backend for Go Athlete Vendor application with PostgreSQL database.

## Features

- User authentication with OTP verification
- Google/Apple social login integration
- JWT token-based authentication
- PostgreSQL database with SQLAlchemy ORM
- Email OTP sending
- New vs existing user detection

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database and update the DATABASE_URL in your environment variables.

3. Copy `env.example` to `.env` and configure your environment variables:
```bash
cp env.example .env
```

4. Run the application:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /auth/send-otp` - Send OTP to email
- `POST /auth/verify-otp` - Verify OTP and authenticate
- `POST /auth/social-login` - Google/Apple social login
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout user

### Example Usage

#### Send OTP
```bash
curl -X POST "http://localhost:8000/auth/send-otp" \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com"}'
```

#### Verify OTP
```bash
curl -X POST "http://localhost:8000/auth/verify-otp" \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "otp_code": "123456"}'
```

#### Social Login
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

## Database Schema

### Users Table
- id (Primary Key)
- email (Unique)
- name
- phone
- is_verified
- is_active
- created_at
- updated_at
- auth_provider (email/google/apple)
- provider_id

### OTPs Table
- id (Primary Key)
- email
- otp_code
- is_used
- expires_at
- created_at
