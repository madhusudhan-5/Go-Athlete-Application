#!/bin/bash

echo "=========================================="
echo "Fixing Ubuntu Repository Issues"
echo "=========================================="

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./fix-ubuntu-repos.sh)"
    exit 1
fi

UBUNTU_VERSION=$(lsb_release -cs)
echo "Detected Ubuntu version: $UBUNTU_VERSION"

echo "Backing up current sources.list..."
cp /etc/apt/sources.list /etc/apt/sources.list.backup

echo "Creating new sources.list for $UBUNTU_VERSION..."

cat > /etc/apt/sources.list << EOF
deb http://old-releases.ubuntu.com/ubuntu/ $UBUNTU_VERSION main restricted universe multiverse
deb http://old-releases.ubuntu.com/ubuntu/ $UBUNTU_VERSION-updates main restricted universe multiverse
deb http://old-releases.ubuntu.com/ubuntu/ $UBUNTU_VERSION-security main restricted universe multiverse
deb http://old-releases.ubuntu.com/ubuntu/ $UBUNTU_VERSION-backports main restricted universe multiverse
EOF

echo "Updating package lists..."
apt update

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "SUCCESS! Repositories fixed."
    echo "=========================================="
    echo "You can now run: sudo ./deploy/deploy.sh"
else
    echo ""
    echo "=========================================="
    echo "ERROR: Still having issues."
    echo "Consider upgrading to Ubuntu 22.04 LTS or 24.04 LTS"
    echo "=========================================="
fi
