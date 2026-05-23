# Cloud Mail 项目概述文档

## 1. 项目简介

Cloud Mail 是一个基于 Cloudflare Workers 的简约响应式邮箱服务，支持邮件发送、附件收发等功能，用户只需一个域名即可创建多个邮箱，实现低成本自建邮件服务。

## 2. 技术栈

### 后端技术栈
- **平台**：Cloudflare Workers
- **Web框架**：Hono
- **ORM框架**：Drizzle
- **缓存服务**：Cloudflare KV
- **数据库**：Cloudflare D1
- **文件存储**：Cloudflare R2
- **邮件服务**：Resend

### 前端技术栈
- **前端框架**：Vue 3
- **UI框架**：Element Plus
- **构建工具**：Vite

### 开发工具
- **包管理器**：pnpm
- **测试框架**：Vitest
- **代码格式化**：Prettier

## 3. 项目结构

### 核心目录说明

```
cloud-mail/
├── mail-worker/              # 后端服务（Cloudflare Worker）
│   ├── src/
│   │   ├── api/             # API接口层
│   │   ├── const/           # 项目常量定义
│   │   ├── dao/             # 数据访问层
│   │   └── ...              # 其他核心模块
│   ├── test/                # 测试目录
│   └── wrangler*.toml       # Cloudflare Worker 配置文件
│
├── mail-vue/                # 前端项目（Vue 3应用）
│   ├── src/
│   │   ├── components/      # Vue组件
│   │   ├── views/           # 页面视图
│   │   └── ...              # 其他前端资源
│   ├── public/              # 静态资源
│   └── vite.config.js       # Vite构建配置
│
├── doc/                     # 项目文档
│   ├── demo/                # 演示截图
│   ├── images/              # 文档图片
│   └── github-action.md     # GitHub Actions配置文档
│
├── .github/
│   ├── ISSUE_TEMPLATE/      # Issue模板
│   └── workflows/           # GitHub Actions工作流
│
├── README.md                # 项目说明（中文）
├── README-en.md             # 项目说明（英文）
└── LICENSE                  # 许可证文件
```

### 核心功能模块

1. **邮件管理模块**
   - 邮件发送（支持群发、内嵌图片、附件）
   - 邮件接收与存储
   - 邮件转发（支持TG机器人等）

2. **用户管理模块**
   - 用户注册与管理
   - RBAC权限控制
   - 资源使用限制

3. **文件存储模块**
   - 附件上传与下载（基于R2对象存储）
   - 文件管理

4. **数据可视化模块**
   - 系统数据统计
   - 用户邮件增长图表（ECharts）

5. **安全验证模块**
   - Turnstile人机验证
   - 验证码识别（Workers AI）

## 4. 开发约定

### 代码组织规范
1. **前后端分离**：项目采用前后端分离架构，`mail-worker` 为后端服务，`mail-vue` 为前端应用
2. **模块化设计**：后端按功能分层（api、dao、const等），前端按组件和页面组织
3. **配置管理**：前端使用环境变量文件（`.env.dev`、`.env.release`、`.env.remote`）管理不同环境配置

### 技术使用约定
1. **数据库操作**：使用 Drizzle ORM 进行数据库操作，配合 Cloudflare D1
2. **缓存策略**：使用 Cloudflare KV 进行数据缓存
3. **文件存储**：使用 Cloudflare R2 对象存储处理附件等文件
4. **邮件服务**：集成 Resend API 进行邮件发送

### 开发工作流
1. **包管理**：统一使用 pnpm 进行依赖管理
2. **代码格式化**：使用 Prettier 统一代码风格
3. **测试框架**：使用 Vitest 进行单元测试
4. **CI/CD**：通过 GitHub Actions 实现自动化部署

### 部署约定
1. **平台适配**：项目专为 Cloudflare Workers 平台设计
2. **环境配置**：通过 wrangler 配置文件管理不同环境（开发、测试、生产）
3. **域名绑定**：支持自定义域名绑定，实现多邮箱服务

### 安全规范
1. **权限控制**：实现 RBAC 权限模型，限制功能和资源访问
2. **人机验证**：集成 Turnstile 防止批量注册和滥用
3. **数据保护**：通过 Cloudflare 平台的安全机制保护用户数据

该文档基于项目仓库结构和README内容生成，涵盖了项目的核心信息和开发规范，为开发者提供清晰的项目概览。