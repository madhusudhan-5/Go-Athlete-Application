#!/bin/bash

set -e

echo "=========================================="
echo "Sports Platform Backend Deployment Script"
echo "=========================================="

PROJECT_DIR="/opt/sportsplatform"
BACKEND_DIR="$PROJECT_DIR/backend"
VENV_DIR="$PROJECT_DIR/venv"
SERVICE_NAME="sportsplatform"

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./deploy.sh)"
    exit 1
fi

echo "[1/7] Installing system dependencies..."
apt update 2>/dev/null || {
    echo ""
    echo "ERROR: apt update failed. Your Ubuntu version may be end-of-life."
    echo "Run this first: sudo ./deploy/fix-ubuntu-repos.sh"
    echo ""
    exit 1
}
apt install -y python3 python3-pip python3-venv nginx

echo "[2/7] Creating project directory..."
mkdir -p $PROJECT_DIR
cp -r . $BACKEND_DIR

echo "[3/7] Creating virtual environment..."
python3 -m venv $VENV_DIR
source $VENV_DIR/bin/activate

echo "[4/7] Installing Python dependencies..."
pip install --upgrade pip
pip install -r $BACKEND_DIR/requirements.txt
pip install gunicorn

echo "[5/7] Running migrations..."
cd $BACKEND_DIR
python manage.py migrate --noinput
python manage.py collectstatic --noinput

echo "[6/7] Setting up systemd service..."
cp $BACKEND_DIR/deploy/sportsplatform.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

echo "[7/7] Checking service status..."
systemctl status $SERVICE_NAME --no-pager

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Service commands:"
echo "  sudo systemctl status $SERVICE_NAME   # Check status"
echo "  sudo systemctl restart $SERVICE_NAME  # Restart after code changes"
echo "  sudo systemctl stop $SERVICE_NAME     # Stop service"
echo "  sudo journalctl -u $SERVICE_NAME -f   # View logs"
echo ""
echo "Backend is running at: http://your-server-ip:5000"
echo ""
