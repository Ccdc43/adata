# A股实时监控网站

基于 adata Python SDK 构建的 A 股实时监控 Web 应用，提供魔法链接登录和 WebSocket 实时数据推送。

## 技术栈

### 前端
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **WebSocket Client**

### 后端
- **Next.js API Routes**
- **Node.js 22+**
- **Prisma ORM**
- **SQLite / PostgreSQL**
- **WebSocket Server (ws)**
- **Nodemailer (SMTP)**

### 部署
- **Nginx** (反向代理)
- **systemd** (进程管理)
- **Let's Encrypt** (SSL 证书)
- **阿里云 ECS**

## 核心功能

✅ **无密码登录** - 魔法链接邮箱验证  
✅ **实时行情** - WebSocket 推送，3秒刷新  
✅ **自选股管理** - 添加、删除、实时监控  
✅ **响应式设计** - 支持桌面和移动端  
✅ **生产就绪** - 完整的部署配置和文档

## 快速开始

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/Ccdc43/adata.git
cd adata/web

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写 SMTP 配置

# 4. 初始化数据库
pnpm exec prisma db push

# 5. 启动开发服务器
pnpm dev:all
# Next.js: http://localhost:3000
# WebSocket: ws://localhost:3001
```

### 生产部署

详细部署步骤请参考 [DEPLOYMENT.md](./docs/DEPLOYMENT.md)。

**快速部署摘要**：

```bash
# 1. 服务器初始化
./deployment/scripts/setup-server.sh

# 2. 配置生产环境变量
cd web && cp .env.example .env
# 编辑 .env，填写真实 SMTP 配置

# 3. 运行部署脚本
./deployment/scripts/deploy.sh
```

## 项目结构

```
adata/
├── adata/                    # Python SDK (原有项目)
├── web/                      # Next.js 网站
│   ├── app/                  # App Router 页面
│   │   ├── api/             # API 路由
│   │   ├── login/           # 登录页面
│   │   ├── verify/          # 验证页面
│   │   └── dashboard/       # 监控面板
│   ├── components/          # React 组件
│   ├── lib/                 # 工具库
│   ├── server/              # WebSocket 服务
│   ├── prisma/              # 数据库模型
│   └── types/               # TypeScript 类型
├── deployment/              # 部署配置
│   ├── nginx/               # Nginx 配置
│   ├── systemd/             # systemd 服务
│   └── scripts/             # 部署脚本
└── docs/                    # 文档
    ├── DEPLOYMENT.md        # 部署指南
    └── USER_GUIDE.md        # 用户指南
```

## 环境变量

关键环境变量说明（完整列表见 `.env.example`）：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接 | `file:./dev.db` |
| `JWT_SECRET` | JWT 密钥 | 随机长字符串 |
| `SMTP_HOST` | SMTP 服务器 | `smtp.qq.com` |
| `SMTP_USER` | SMTP 用户名 | `your@email.com` |
| `SMTP_PASS` | SMTP 密码/授权码 | `your-auth-code` |
| `NEXT_PUBLIC_APP_URL` | 应用 URL | `https://ledone.xyz` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `wss://ledone.xyz/ws` |

## API 路由

### 认证
- `POST /api/auth/login` - 发送魔法链接
- `POST /api/auth/verify` - 验证魔法链接
- `POST /api/auth/logout` - 退出登录
- `GET /api/auth/me` - 获取当前用户

### 股票数据
- `GET /api/stock/list` - 获取股票列表
- `GET /api/stock/:code` - 获取股票行情
- `GET /api/stock/:code/kline` - 获取 K 线数据

### 自选股
- `GET /api/watchlist` - 获取自选股列表
- `POST /api/watchlist` - 添加自选股
- `DELETE /api/watchlist?id=xxx` - 删除自选股

## WebSocket 协议

连接地址：`ws://localhost:3001` (开发) / `wss://ledone.xyz/ws` (生产)

### 消息类型

**订阅股票**
```json
{
  "type": "subscribe",
  "data": { "codes": ["600519", "000001"] }
}
```

**取消订阅**
```json
{
  "type": "unsubscribe",
  "data": { "codes": ["600519"] }
}
```

**行情推送**
```json
{
  "type": "quote",
  "data": {
    "code": "600519",
    "name": "贵州茅台",
    "price": 1650.50,
    "change": 12.30,
    "changePercent": 0.75,
    ...
  }
}
```

## 维护命令

```bash
# 查看服务状态
sudo systemctl status adata-web.service

# 查看实时日志
journalctl -u adata-web.service -f

# 重启服务
sudo systemctl restart adata-web.service

# 重启 Nginx
sudo systemctl restart nginx

# 数据库迁移
cd web && pnpm exec prisma db push

# 查看数据库
cd web && pnpm exec prisma studio
```

## 许可证

本项目基于 adata Python SDK 开发，遵循原项目的开源协议。

## 联系方式

- **项目地址**: https://github.com/Ccdc43/adata
- **线上地址**: https://ledone.xyz
- **服务器**: 47.106.70.26 (阿里云)

---

**作者**: Manus AI  
**创建日期**: 2025-11-03
