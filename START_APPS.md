# 🚀 Start All Applications

## Backend API (Port 8000)
```bash
cd goathlete-admin
source venv/bin/activate
python manage.py runserver 8000
```

## Super Admin (Port 8001)
```bash
cd goathlete-superadmin
source venv/bin/activate
python manage.py runserver 8001
```

## Mobile App (Web Mode)
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18
cd goathlete-vendor/go-athlete-vendor-app
npx expo start --web
```

## Mobile App (With QR Code)
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18
cd goathlete-vendor/go-athlete-vendor-app
npx expo start --clear
```

## URLs
- Backend: http://localhost:8000
- Super Admin: http://localhost:8001
- Mobile Web: http://localhost:19006

