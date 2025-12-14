# Local Development Setup Guide

This guide explains how to run the Sports Platform locally on your machine.

## Prerequisites

- Python 3.11+
- Node.js 18+
- PyCharm (for backend development)
- VSCode (for frontend/Vendor App development)
- DBeaver (for database management)
- Git

## Backend Setup (PyCharm)

### 1. Clone and Open in PyCharm

```bash
git clone <repository-url>
cd admin-console
```

Open the `backend` folder in PyCharm.

### 2. Create Virtual Environment

In PyCharm:
1. Go to File > Settings > Project > Python Interpreter
2. Click the gear icon > Add > Virtualenv Environment
3. Select "New environment" with Python 3.11+

Or via terminal:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

### 3. Install Dependencies

```bash
pip install django djangorestframework djangorestframework-simplejwt
pip install django-cors-headers drf-spectacular
pip install channels channels-redis
pip install twilio resend
pip install gunicorn pytest-django
```

Or create a requirements.txt and run:
```bash
pip install -r requirements.txt
```

### 4. Environment Variables

Create a `.env` file in the `backend` folder:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True

# SMS (optional - defaults to LOG mode)
SMS_MODE=LOG
TWILIO_SID=your-twilio-sid
TWILIO_TOKEN=your-twilio-token
TWILIO_FROM=+1234567890

# Email (optional - defaults to LOG mode)
EMAIL_MODE=LOG
RESEND_API_KEY=your-resend-key
```

### 5. Database Setup (SQLite - default)

```bash
cd backend
python manage.py migrate
python manage.py seed_users
```

### 6. Run the Backend

```bash
python manage.py runserver 0.0.0.0:5000
```

Access at: http://localhost:5000

### PyCharm Run Configuration

1. Go to Run > Edit Configurations
2. Click + > Python
3. Set:
   - Script path: `manage.py`
   - Parameters: `runserver 0.0.0.0:5000`
   - Working directory: `/path/to/backend`
   - Python interpreter: Your virtual environment

## Vendor App Setup (VSCode)

### 1. Open in VSCode

Open the `vendor-app` folder in VSCode.

### 2. Install Dependencies

```bash
cd vendor-app
npm install
```

### 3. Configure API URL

Edit `vendor-app/src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### 4. Run the Vendor App

```bash
npx expo start --web --port 3000
```

Access at: http://localhost:3000

### VSCode Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Expo Web",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["expo", "start", "--web", "--port", "3000"],
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

## Database Setup (DBeaver)

### SQLite Connection (Default)

1. Open DBeaver
2. Database > New Database Connection
3. Select "SQLite"
4. Browse to: `backend/db.sqlite3`
5. Click "Test Connection" then "Finish"

### PostgreSQL Connection (Production)

If using PostgreSQL:

1. Open DBeaver
2. Database > New Database Connection
3. Select "PostgreSQL"
4. Enter:
   - Host: `localhost` (or your DB host)
   - Port: `5432`
   - Database: `sportsplatform`
   - Username: Your DB username
   - Password: Your DB password
5. Click "Test Connection" then "Finish"

### Useful DBeaver Features

- **View Tables**: Expand your connection > Tables
- **Run Queries**: Open SQL Editor (F3)
- **Export Data**: Right-click table > Export Data
- **ER Diagram**: Right-click connection > View Diagram

## User Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@sportsplatform.com | SuperAdmin@123 |
| Admin | admin@sportsplatform.com | Admin@123 |

## Building Tailwind CSS

If you modify CSS styles:

```bash
cd backend
npm install
npm run css:build
```

For development with auto-rebuild:
```bash
npm run css:watch
```

## API Documentation

When backend is running:
- Swagger UI: http://localhost:5000/api/docs/
- ReDoc: http://localhost:5000/api/redoc/
- OpenAPI Schema: http://localhost:5000/api/schema/

## Running Tests

```bash
cd backend
python manage.py test superadmin
```

## Troubleshooting

### CORS Issues
Ensure `django-cors-headers` is installed and configured in `settings.py`:
```python
CORS_ALLOW_ALL_ORIGINS = True  # For development only
```

### Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Reset Database
```bash
rm backend/db.sqlite3
python manage.py migrate
python manage.py seed_users
```

### Port Already in Use
```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## Project Structure

```
admin-console/
├── backend/                 # Django Backend (PyCharm)
│   ├── backend/            # Django settings
│   ├── superadmin/         # Main app (models, views, APIs)
│   ├── templates/          # Admin Console HTML templates
│   ├── static/             # CSS, JS, images
│   ├── manage.py
│   └── db.sqlite3          # SQLite database (DBeaver)
│
└── vendor-app/             # Expo React Native (VSCode)
    ├── src/
    │   ├── screens/        # App screens
    │   ├── components/     # Reusable components
    │   ├── services/       # API services
    │   └── context/        # React contexts
    ├── App.js
    └── package.json
```
