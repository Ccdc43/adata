#!/bin/bash

# A股实时监控网站 - 部署脚本

set -e

# --- 变量定义 ---
PROJECT_DIR="/home/ubuntu/adata"
WEB_DIR="$PROJECT_DIR/web"
SERVICE_NAME="adata-web.service"
NGINX_CONF="ledone.xyz.conf"

# --- 1. 更新代码 ---
echo "Updating source code from Git..."
cd $PROJECT_DIR
git pull origin main

# --- 2. 安装依赖 ---
echo "Installing dependencies..."
cd $WEB_DIR
# 确保 pnpm 可用
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
pnpm install

# --- 3. 配置生产环境变量 ---
echo "Configuring production environment..."
if [ ! -f "$WEB_DIR/.env" ]; then
    echo "Error: .env file not found. Please create it from .env.example and fill in production values."
    exit 1
fi
# 确保 NODE_ENV 是 production
sed -i 's/NODE_ENV=development/NODE_ENV=production/g' $WEB_DIR/.env
sed -i 's|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://ledone.xyz|g' $WEB_DIR/.env
sed -i 's|NEXT_PUBLIC_WS_URL=.*|NEXT_PUBLIC_WS_URL=wss://ledone.xyz/ws|g' $WEB_DIR/.env

# --- 4. 数据库迁移 ---
echo "Running database migrations..."
cd $WEB_DIR
pnpm exec prisma db push

# --- 5. 构建项目 ---
echo "Building Next.js application..."
cd $WEB_DIR
pnpm build

# --- 6. 部署 systemd 服务 ---
echo "Deploying systemd service..."
sudo cp "$PROJECT_DIR/deployment/systemd/$SERVICE_NAME" "/etc/systemd/system/$SERVICE_NAME"
sudo systemctl daemon-reload

# --- 7. 部署 Nginx 配置 ---
echo "Deploying Nginx configuration..."
sudo cp "$PROJECT_DIR/deployment/nginx/$NGINX_CONF" "/etc/nginx/sites-available/$NGINX_CONF"
# 创建软链接
if [ ! -L "/etc/nginx/sites-enabled/$NGINX_CONF" ]; then
    sudo ln -s "/etc/nginx/sites-available/$NGINX_CONF" "/etc/nginx/sites-enabled/"
fi
# 测试 Nginx 配置
sudo nginx -t

# --- 8. 重启服务 ---
echo "Restarting services..."
sudo systemctl restart $SERVICE_NAME
sudo systemctl enable $SERVICE_NAME
sudo systemctl restart nginx

# --- 9. 完成 ---
echo ""
echo "✅ Deployment successful!"
echo "Your application should be live at https://ledone.xyz"
echo ""
echo "To monitor the application logs, run:"
echo "journalctl -u $SERVICE_NAME -f"
