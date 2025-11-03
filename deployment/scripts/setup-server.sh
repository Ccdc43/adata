#!/bin/bash

# A股实时监控网站 - 服务器初始化脚本
# 运行环境: Ubuntu 22.04

set -e

# --- 变量定义 ---
DOMAIN="ledone.xyz"
EMAIL="1530694584@qq.com" # 用于 Let's Encrypt

# --- 1. 更新系统 ---
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# --- 2. 安装基础工具 ---
echo "Installing essential tools..."
sudo apt-get install -y curl wget git build-essential

# --- 3. 安装 Node.js (使用 nvm) ---
echo "Installing Node.js via nvm..."
if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

nvm install 22
nvm use 22
nvm alias default 22

# 安装 pnpm
if ! command -v pnpm &> /dev/null
then
    echo "Installing pnpm..."
    npm install -g pnpm
fi

# --- 4. 安装 Python ---
echo "Installing Python..."
sudo apt-get install -y python3 python3-pip python3-venv

# --- 5. 安装 Nginx ---
echo "Installing Nginx..."
sudo apt-get install -y nginx

# --- 6. 配置防火墙 ---
echo "Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000/tcp # Next.js dev port
sudo ufw allow 3001/tcp # WebSocket dev port
sudo ufw enable

# --- 7. 安装 Certbot (Let's Encrypt) ---
echo "Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

# --- 8. 申请 SSL 证书 ---
echo "Requesting SSL certificate for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

# --- 9. 创建项目目录 ---
echo "Creating project directory..."
sudo mkdir -p /var/www/$DOMAIN
sudo chown -R $USER:$USER /var/www/$DOMAIN

# --- 10. 提示后续步骤 ---
echo ""
echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your project into /var/www/$DOMAIN"
echo "2. Configure your production .env file"
echo "3. Run the deploy.sh script"
echo ""
