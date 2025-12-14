#!/bin/bash

set -e

echo "=========================================="
echo "Domain & SSL Setup Script"
echo "=========================================="

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./setup-domain.sh)"
    exit 1
fi

read -p "Enter your domain (e.g., goathlete.in): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "Domain cannot be empty"
    exit 1
fi

read -p "Enter your email for SSL certificate: " EMAIL

if [ -z "$EMAIL" ]; then
    echo "Email cannot be empty"
    exit 1
fi

echo ""
echo "[1/6] Installing Nginx and Certbot..."
apt install -y nginx certbot python3-certbot-nginx

echo "[2/6] Creating ACME challenge directory..."
mkdir -p /var/www/letsencrypt/.well-known/acme-challenge
chmod -R 755 /var/www/letsencrypt
chown -R www-data:www-data /var/www/letsencrypt

echo "[3/6] Creating initial Nginx configuration (HTTP only)..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # ACME challenge location - MUST be first
    location ^~ /.well-known/acme-challenge/ {
        default_type "text/plain";
        root /var/www/letsencrypt;
        try_files \$uri =404;
    }

    location /static/ {
        alias /opt/goathleteBackend/backend/staticfiles/;
    }

    location /media/ {
        alias /opt/goathleteBackend/backend/media/;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
        client_max_body_size 20M;
    }
}
EOF

echo "[4/6] Enabling site and testing Nginx..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "[5/6] Testing ACME challenge access..."
echo "test" > /var/www/letsencrypt/.well-known/acme-challenge/test.txt
sleep 2
TEST_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/.well-known/acme-challenge/test.txt)
rm -f /var/www/letsencrypt/.well-known/acme-challenge/test.txt

if [ "$TEST_RESULT" != "200" ]; then
    echo ""
    echo "WARNING: ACME challenge test returned HTTP $TEST_RESULT (expected 200)"
    echo "Possible issues:"
    echo "  - Firewall blocking port 80"
    echo "  - DNS not pointing to this server"
    echo ""
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

echo "[6/6] Obtaining SSL certificate..."
certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Your backend is now available at:"
echo "  https://$DOMAIN"
echo ""
echo "Update your frontend API URL to:"
echo "  https://$DOMAIN/api/"
echo ""
