> **注意**: 在开始之前，请确保您已将域名 `ledone.xyz` 的 DNS A 记录指向您的服务器 IP `47.106.70.26`。

## 1. 服务器初始化

此步骤将配置运行网站所需的所有基础软件。我们提供了一个自动化脚本来完成此操作。

### 1.1. 连接服务器

首先，通过 SSH 连接到您的阿里云服务器：

```bash
ssh root@47.106.70.26
```

### 1.2. 下载并运行初始化脚本

您需要先将 `setup-server.sh` 脚本上传到服务器，或者直接在服务器上创建该文件。

```bash
# 在服务器上执行

# 下载脚本（如果项目已在 GitHub）
# git clone https://github.com/Ccdc43/adata.git
# cd adata/deployment/scripts

# 或者，手动创建脚本文件
nano setup-server.sh
# 将 deployment/scripts/setup-server.sh 的内容粘贴进去，保存并退出

# 赋予脚本执行权限
chmod +x setup-server.sh

# 运行脚本
./setup-server.sh
```

此脚本将自动完成以下任务：
- 更新系统软件包
- 安装 Nginx、Python、Node.js (via nvm) 和 pnpm
- 配置防火墙，开放 80 (HTTP), 443 (HTTPS) 端口
- 安装 Certbot 并为 `ledone.xyz` 申请和配置 SSL 证书

## 2. 应用部署

服务器环境配置完成后，可以部署应用程序。

### 2.1. 克隆代码库

如果第一步中尚未克隆，请克隆项目代码库。

```bash
# 在服务器上执行
cd /home/ubuntu
git clone https://github.com/Ccdc43/adata.git
```

### 2.2. 配置生产环境变量

部署前，必须配置生产环境所需的环境变量，特别是 **SMTP 邮件服务**。

```bash
# 在服务器上执行
cd /home/ubuntu/adata/web

# 从模板复制环境变量文件
cp .env.example .env

# 编辑 .env 文件
nano .env
```

您需要将 `.env` 文件中的以下占位符替换为您的真实配置：

```dotenv
# 数据库配置 (生产环境建议使用 PostgreSQL, 但 SQLite 也能工作)
# DATABASE_URL="postgresql://user:password@host:port/database"
DATABASE_URL="file:./prod.db"

# JWT 密钥 (必须修改为一个长且随机的字符串)
JWT_SECRET="a_very_long_and_random_secret_string_for_production"

# SMTP 邮件配置 (以 QQ 邮箱为例)
SMTP_HOST="smtp.qq.com"
SMTP_PORT="587"
SMTP_SECURE="false" # 对于 QQ 邮箱，通常是 false 或 true (SSL 端口 465)
SMTP_USER="your-email@qq.com" # 您的 QQ 邮箱地址
SMTP_PASS="your_qq_email_smtp_authorization_code" # QQ 邮箱的 SMTP 授权码，不是登录密码
SMTP_FROM="A股监控 <your-email@qq.com>"

# 应用配置 (部署脚本会自动修改)
# NEXT_PUBLIC_APP_URL="https://ledone.xyz"
# NODE_ENV="production"

# WebSocket 配置 (部署脚本会自动修改)
# NEXT_PUBLIC_WS_URL="wss://ledone.xyz/ws"
```

> **重要**: `SMTP_PASS` 通常不是您的邮箱登录密码，而是需要从您的邮件服务商（如 QQ 邮箱、Gmail）设置中获取的 **应用专用密码** 或 **授权码**。

### 2.3. 运行部署脚本

配置完成后，运行 `deploy.sh` 脚本来自动化构建、配置和启动服务。

```bash
# 在服务器上执行
cd /home/ubuntu/adata/deployment/scripts

# 赋予脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

此脚本将完成以下工作：
1.  从 Git 拉取最新代码。
2.  安装所有 Node.js 依赖。
3.  更新 `.env` 文件中的应用 URL 和 WebSocket URL。
4.  执行数据库迁移 (`prisma db push`)。
5.  构建 Next.js 应用 (`pnpm build`)。
6.  将 Nginx 和 systemd 配置文件复制到系统目录。
7.  重新加载并启动 `adata-web` 服务和 `nginx` 服务。

## 3. 验证与维护

### 3.1. 检查服务状态

部署完成后，您可以检查服务是否正常运行。

```bash
# 检查应用服务状态
sudo systemctl status adata-web.service

# 检查 Nginx 服务状态
sudo systemctl status nginx
```

### 3.2. 查看实时日志

如果应用无法启动或出现问题，可以查看实时日志进行排查。

```bash
# 查看 adata-web 服务的实时日志
journalctl -u adata-web.service -f
```

### 3.3. SSL 证书续订

Certbot 会自动处理 SSL 证书的续订。您可以通过以下命令模拟续订过程以确保其正常工作。

```bash
sudo certbot renew --dry-run
```

## 4. 更新部署

当您推送了新的代码到 `main` 分支后，只需在服务器上重新运行部署脚本即可完成更新。

```bash
# 在服务器上执行
cd /home/ubuntu/adata/deployment/scripts
./deploy.sh
```
