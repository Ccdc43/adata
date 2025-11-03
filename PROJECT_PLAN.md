# A 股实时监控网站 - 项目规划与任务清单

## 项目概述

在现有 adata Python SDK 仓库基础上，构建一个 Next.js 全栈 A 股实时监控网站，实现魔法链接邮箱登录和实时数据推送功能。

## 技术架构

### 前端技术栈
- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: React Context + Hooks
- **实时通信**: WebSocket Client
- **HTTP 客户端**: fetch API

### 后端技术栈
- **运行时**: Node.js 22+
- **框架**: Next.js API Routes + Custom Server
- **数据库**: SQLite (开发) / PostgreSQL (生产可选)
- **ORM**: Prisma
- **认证**: 魔法链接 (Passwordless Email)
- **邮件服务**: Nodemailer + SMTP
- **实时通信**: ws (WebSocket Server)
- **数据源**: adata Python SDK (通过子进程调用)

### 部署架构
- **服务器**: 阿里云 ECS (47.106.70.26)
- **域名**: ledone.xyz
- **反向代理**: Nginx
- **进程管理**: systemd
- **SSL**: Let's Encrypt (Certbot)

## 目录结构

```
adata/
├── adata/                    # 原有 Python SDK
├── web/                      # Next.js 网站项目
│   ├── src/
│   │   ├── app/             # App Router 页面
│   │   │   ├── (auth)/      # 认证相关页面
│   │   │   │   ├── login/
│   │   │   │   └── verify/
│   │   │   ├── dashboard/   # 监控面板
│   │   │   ├── api/         # API 路由
│   │   │   │   ├── auth/
│   │   │   │   └── stock/
│   │   │   └── layout.tsx
│   │   ├── components/      # React 组件
│   │   ├── lib/            # 工具库
│   │   │   ├── db.ts       # 数据库客户端
│   │   │   ├── email.ts    # 邮件服务
│   │   │   ├── auth.ts     # 认证逻辑
│   │   │   └── adata.ts    # adata SDK 调用
│   │   └── types/          # TypeScript 类型
│   ├── prisma/
│   │   └── schema.prisma   # 数据库模型
│   ├── server/             # 自定义服务器
│   │   └── websocket.ts    # WebSocket 服务
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── .env.example
├── deployment/              # 部署配置
│   ├── nginx/
│   │   └── ledone.xyz.conf
│   ├── systemd/
│   │   └── adata-web.service
│   └── scripts/
│       ├── deploy.sh
│       └── setup-server.sh
└── docs/
    ├── DEPLOYMENT.md        # 部署文档
    └── USER_GUIDE.md        # 用户指南
```

## 核心功能模块

### 1. 用户认证系统
- **魔法链接登录**
  - 用户输入邮箱
  - 生成带 token 的验证链接
  - 发送邮件
  - 点击链接完成登录
  - JWT Session 管理

### 2. A 股数据服务
- **数据获取**
  - 通过 Node.js 子进程调用 adata Python SDK
  - 获取股票列表、实时行情、K线数据
  - 缓存机制优化性能

- **WebSocket 实时推送**
  - 建立 WebSocket 连接
  - 订阅股票代码
  - 实时推送行情变化
  - 心跳保活机制

### 3. 监控面板
- **股票列表**
  - 搜索和筛选
  - 自选股管理
  - 实时价格显示

- **详情页面**
  - K线图表 (可选集成 ECharts)
  - 实时行情数据
  - 历史数据查询

### 4. 邮件推送服务
- **SMTP 配置**
  - 支持主流邮件服务商
  - 模板化邮件内容
  - 发送队列和重试机制

## 数据库模型

### User 表
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sessions  Session[]
  watchlist Watchlist[]
}
```

### Session 表
```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### MagicLink 表
```prisma
model MagicLink {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Watchlist 表 (自选股)
```prisma
model Watchlist {
  id        String   @id @default(cuid())
  userId    String
  stockCode String
  stockName String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, stockCode])
}
```

## API 路由设计

### 认证相关
- `POST /api/auth/login` - 发送魔法链接
- `POST /api/auth/verify` - 验证魔法链接
- `POST /api/auth/logout` - 退出登录
- `GET /api/auth/me` - 获取当前用户

### 股票数据
- `GET /api/stock/list` - 获取股票列表
- `GET /api/stock/:code` - 获取股票详情
- `GET /api/stock/:code/kline` - 获取K线数据
- `POST /api/watchlist` - 添加自选股
- `DELETE /api/watchlist/:id` - 删除自选股
- `GET /api/watchlist` - 获取自选股列表

### WebSocket
- `ws://ledone.xyz/ws` - WebSocket 连接端点
  - 消息类型: `subscribe`, `unsubscribe`, `ping`, `pong`

## 部署流程

### 1. 服务器准备
- 安装 Node.js 22+
- 安装 Python 3.8+
- 安装 Nginx
- 配置防火墙 (80, 443, 3000)

### 2. 项目部署
- 克隆代码
- 安装依赖 (npm install)
- 配置环境变量
- 构建项目 (npm run build)
- 数据库迁移 (npx prisma migrate deploy)

### 3. Nginx 配置
- 配置反向代理
- WebSocket 升级支持
- SSL 证书配置

### 4. systemd 服务
- 创建服务文件
- 启动服务
- 开机自启

### 5. 域名配置
- DNS A 记录指向 47.106.70.26
- SSL 证书申请

## 环境变量配置

```env
# 数据库
DATABASE_URL="file:./dev.db"

# JWT 密钥
JWT_SECRET="your-secret-key-here"

# SMTP 配置
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
SMTP_FROM="A股监控 <noreply@ledone.xyz>"

# 应用配置
NEXT_PUBLIC_APP_URL="https://ledone.xyz"
NODE_ENV="production"

# WebSocket
WS_PORT="3001"
```

## 开发任务清单

### Phase 1: 项目初始化 ✓
- [x] 规划项目架构
- [x] 设计数据库模型
- [x] 设计 API 路由
- [ ] 创建项目目录结构

### Phase 2: Next.js 项目搭建
- [ ] 初始化 Next.js 项目
- [ ] 配置 TypeScript
- [ ] 安装核心依赖
- [ ] 配置 Tailwind CSS
- [ ] 设置 Prisma ORM

### Phase 3: 认证系统
- [ ] 实现魔法链接生成
- [ ] 实现 SMTP 邮件发送
- [ ] 实现 JWT 认证中间件
- [ ] 创建登录页面
- [ ] 创建验证页面

### Phase 4: A 股数据服务
- [ ] 封装 adata SDK 调用
- [ ] 实现股票列表 API
- [ ] 实现股票详情 API
- [ ] 实现 WebSocket 服务
- [ ] 实现实时数据推送

### Phase 5: 前端界面
- [ ] 创建布局组件
- [ ] 实现登录流程
- [ ] 实现监控面板
- [ ] 实现股票列表
- [ ] 实现实时数据展示
- [ ] 实现自选股管理

### Phase 6: 部署配置
- [ ] 编写 Nginx 配置
- [ ] 编写 systemd 服务文件
- [ ] 编写部署脚本
- [ ] 编写服务器设置脚本

### Phase 7: 文档编写
- [ ] 编写部署文档
- [ ] 编写用户指南
- [ ] 编写 API 文档
- [ ] 更新 README

### Phase 8: 提交代码
- [ ] Git 提交所有代码
- [ ] 推送到 GitHub
- [ ] 创建 Release

## 技术要点

### 1. adata SDK 集成
使用 Node.js `child_process` 模块调用 Python SDK：

```typescript
import { spawn } from 'child_process';

export async function getStockList() {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', ['-c', `
import adata
result = adata.stock.info.all_code()
print(result.to_json(orient='records'))
    `]);
    
    let data = '';
    python.stdout.on('data', (chunk) => data += chunk);
    python.on('close', (code) => {
      if (code === 0) resolve(JSON.parse(data));
      else reject(new Error('Python script failed'));
    });
  });
}
```

### 2. WebSocket 实时推送
使用 `ws` 库实现 WebSocket 服务器：

```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    if (data.type === 'subscribe') {
      // 订阅股票实时数据
      subscribeStock(data.code, ws);
    }
  });
});
```

### 3. 魔法链接认证
生成带过期时间的 token：

```typescript
import { randomBytes } from 'crypto';
import { sign, verify } from 'jsonwebtoken';

export function generateMagicLink(email: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分钟
  
  return {
    token,
    expiresAt,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`
  };
}
```

## 性能优化

1. **数据缓存**: 使用 Redis 或内存缓存股票列表
2. **WebSocket 连接池**: 限制单个用户的订阅数量
3. **数据库索引**: 在常用查询字段上建立索引
4. **CDN**: 静态资源使用 CDN 加速
5. **代码分割**: Next.js 自动代码分割优化加载

## 安全措施

1. **HTTPS**: 强制使用 HTTPS
2. **CORS**: 配置正确的 CORS 策略
3. **Rate Limiting**: API 请求频率限制
4. **JWT 过期**: Session 定期过期
5. **环境变量**: 敏感信息使用环境变量
6. **SQL 注入防护**: 使用 Prisma ORM 参数化查询

## 监控和日志

1. **应用日志**: 使用 Winston 或 Pino
2. **错误追踪**: 可选集成 Sentry
3. **性能监控**: Next.js Analytics
4. **服务器监控**: systemd 日志 + journalctl

---

**项目负责人**: 资深全栈/DevOps 架构师  
**创建日期**: 2025-11-03  
**目标部署**: https://ledone.xyz  
**服务器**: 47.106.70.26 (阿里云)
