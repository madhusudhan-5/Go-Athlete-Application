# Backend Deployment Guide

## Quick Deployment (Minimal Effort)

### Step 1: Deploy Backend

1. Copy the entire `backend` folder to your Linux server
2. Run the deployment script:

```bash
cd backend
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

### Step 2: Set Up Domain (Hide IP Address)

After backend is running, set up your domain with SSL:

```bash
chmod +x deploy/setup-domain.sh
sudo ./deploy/setup-domain.sh
```

The script will ask for:
- Your domain (e.g., `api.yourdomain.com`)
- Your email (for SSL certificate)

**Before running**, make sure your domain's DNS points to your server:
- Add an **A record**: `api.yourdomain.com` → `your-server-ip`

After setup, your backend will be available at:
- `https://api.yourdomain.com` (instead of `http://your-ip:5000`)

### Step 3: Update Frontend

Set the API URL in your frontend apps:

**Vendor App (.env or environment):**
```
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

**Admin Frontend (.env):**
```
VITE_API_URL=https://api.yourdomain.com
```

---

## What the Scripts Do

The deployment script will:
- Install dependencies
- Create virtual environment
- Run migrations
- Set up systemd service
- Start the backend

### Option 2: Manual Setup

1. **Copy files to server:**
```bash
scp -r backend/ user@your-server:/opt/sportsplatform/
```

2. **Create virtual environment:**
```bash
cd /opt/sportsplatform
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
pip install gunicorn
```

3. **Run migrations:**
```bash
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
```

4. **Copy systemd service:**
```bash
sudo cp deploy/sportsplatform.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sportsplatform
sudo systemctl start sportsplatform
```

## Service Management Commands

```bash
# Check status
sudo systemctl status sportsplatform

# Restart (after code changes)
sudo systemctl restart sportsplatform

# Stop
sudo systemctl stop sportsplatform

# View logs (real-time)
sudo journalctl -u sportsplatform -f

# View recent logs
sudo journalctl -u sportsplatform --since "1 hour ago"
```

## Environment Variables

Create `/opt/sportsplatform/.env` with your production settings:

```bash
DEBUG=False
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgres://user:pass@host:5432/dbname
ALLOWED_HOSTS=yourdomain.com,your-server-ip
TWILIO_SID=your-twilio-sid
TWILIO_TOKEN=your-twilio-token
TWILIO_FROM=your-twilio-number
```

## Update Deployment

After pushing code changes:

```bash
cd /opt/sportsplatform/backend
git pull  # or copy new files
source ../venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart sportsplatform
```

## Nginx Reverse Proxy (Optional)

For production with domain name and SSL:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /opt/sportsplatform/backend/staticfiles/;
    }
}
```

Enable with:
```bash
sudo ln -s /etc/nginx/sites-available/sportsplatform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Troubleshooting

**Service won't start:**
```bash
sudo journalctl -u sportsplatform -n 50
```

**Permission issues:**
```bash
sudo chown -R www-data:www-data /opt/sportsplatform
```

**Port already in use:**
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```
