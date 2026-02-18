# API 接口文档

> 记录当前应用提供的所有 API 接口，包含 URL、方法、入参、返回值和调用示例。
> 每步开发新增接口时同步更新本文档。

**Base URL**：`http://localhost:3000`（本地开发）

**CORS 配置**：服务端已启用 CORS，允许前端地址由环境变量 `CORS_ORIGIN` 控制（默认 `http://localhost:5173`），并开启 `credentials: true` 以支持跨域携带 Cookie。

---

## 一、健康检查

### GET /health

检查服务运行状态和数据库连接状态。

**请求**：无需参数

**返回值**：
```json
{
  "status": "ok",
  "timestamp": "2026-02-18T13:57:37.651Z",
  "database": "connected"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 固定 `"ok"` |
| timestamp | string | 当前服务器时间（ISO 8601） |
| database | string | `"connected"` 或 `"disconnected"` |

**curl 示例**：
```bash
curl http://localhost:3000/health
```

---

## 二、用户认证（BetterAuth）

> 认证接口由 BetterAuth 框架提供，统一前缀 `/api/auth`。
> 会话通过 HttpOnly Cookie（`better-auth.session_token`）管理，有效期 7 天。
>
> **前端接入**：前端使用 `@better-auth/client` SDK 与后端对接登录验证的部分，SDK 会自动处理 Cookie 管理和会话状态，返回统一的 `{ data, error }` 结构。以下 `curl` 示例仅用于后端手动验证。

### 错误响应格式

BetterAuth 路由（`/api/auth/*`）的错误响应统一使用以下结构：

```json
{
  "code": "ERROR_CODE",
  "message": "人类可读的错误描述"
}
```

> 注意：这与 NestJS 默认的错误格式 `{ statusCode, message, error }` 不同。前端可通过响应体结构区分错误来源。

**已知错误码清单**：

| HTTP 状态码 | code | message | 触发场景 |
|------------|------|---------|---------|
| 400 | `VALIDATION_ERROR` | `[body.email] Invalid email address` | 邮箱格式无效 |
| 400 | `VALIDATION_ERROR` | `[body.name] Invalid input: expected string, received undefined` | 缺少必填字段 |
| 400 | `PASSWORD_TOO_SHORT` | `Password too short` | 密码少于 8 位 |
| 401 | `INVALID_EMAIL_OR_PASSWORD` | `Invalid email or password` | 登录时邮箱不存在或密码错误 |
| 422 | `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` | `User already exists. Use another email.` | 注册时邮箱已被使用 |

> `get-session` 在 token 无效或过期时返回 **HTTP 200 + `null`**（不是 401）。

### POST /api/auth/sign-up/email

邮箱密码注册新用户。

**请求头**：
```
Content-Type: application/json
```

**请求体**：
```json
{
  "name": "测试用户",
  "email": "test@example.com",
  "password": "Test123456!"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✅ | 用户显示名称（允许空字符串） |
| email | string | ✅ | 邮箱地址（全局唯一，需符合邮箱格式） |
| password | string | ✅ | 密码（最少 8 位，无复杂度要求；BetterAuth 自动加盐哈希存储） |

**成功返回**（HTTP 200）：
```json
{
  "token": "h3TTLhTNzx8cwnUPNN12YdscZs8t7Sxo",
  "user": {
    "id": "gpSBZwZ6TukPWxGh4X3WRJPACAKaXF91",
    "name": "测试用户",
    "email": "test@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2026-02-18T13:57:49.260Z",
    "updatedAt": "2026-02-18T13:57:49.260Z"
  }
}
```

**响应头**：
```
set-cookie: better-auth.session_token=<token>.<HMAC签名>; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax
```

> 注册成功后**自动登录**：响应中同时设置会话 Cookie，前端无需再调用 sign-in 接口。

**失败场景**：
| HTTP 状态码 | code | 场景 |
|------------|------|------|
| 400 | `VALIDATION_ERROR` | 邮箱格式无效 / 缺少必填字段 |
| 400 | `PASSWORD_TOO_SHORT` | 密码少于 8 位 |
| 422 | `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` | 邮箱已被注册 |

**curl 示例**：
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com","password":"Test123456!"}'
```

---

### POST /api/auth/sign-in/email

邮箱密码登录。

**请求头**：
```
Content-Type: application/json
```

**请求体**：
```json
{
  "email": "test@example.com",
  "password": "Test123456!"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 注册时的邮箱 |
| password | string | ✅ | 密码 |

**成功返回**（HTTP 200）：
```json
{
  "redirect": false,
  "token": "4YMeifbwSqqjKZDcYmCvgj7J6PQ1J26l",
  "user": {
    "id": "gpSBZwZ6TukPWxGh4X3WRJPACAKaXF91",
    "name": "测试用户",
    "email": "test@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2026-02-18T13:57:49.260Z",
    "updatedAt": "2026-02-18T13:57:49.260Z"
  }
}
```

**响应头**（关键）：
```
set-cookie: better-auth.session_token=<token>.<HMAC签名>; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax
```

> ⚠️ **重要区别**：
> - JSON 响应体的 `token` 字段：仅包含 session token 标识（如 `w4aYWnc1SeR7NGKAT5uTBAofPFdB7NJV`）
> - `Set-Cookie` 响应头的值：包含 `token.HMAC签名`（如 `w4aYWnc1SeR7NGKAT5uTBAofPFdB7NJV.5q3qW3AuvJlJTfMu8Q0FC4ytKjWWc4hNPJkFanluGUo%3D`）
>
> **`get-session` 接口必须使用 `Set-Cookie` 中的完整值（含 `.` 后的签名），不能使用 JSON body 中的 `token`，否则会返回 `null`。**
>
> 推荐使用 `curl -c tmp/cookies.txt` 自动保存 cookie，再用 `curl -b tmp/cookies.txt` 发送，避免手动复制出错。

**失败场景**：
| HTTP 状态码 | code | 场景 |
|------------|------|------|
| 401 | `INVALID_EMAIL_OR_PASSWORD` | 邮箱不存在或密码错误 |

**curl 示例**：
```bash
# 登录并保存 Cookie 到文件
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!"}' \
  -c tmp/cookies.txt -v

# -c tmp/cookies.txt 会将响应中的 Set-Cookie 保存到 tmp/cookies.txt 文件
# -v 显示详细信息，可以看到 Set-Cookie 响应头
```

---

### GET /api/auth/get-session

获取当前登录用户的会话信息。需要携带登录时返回的 Cookie。

**请求头**：
```
Cookie: better-auth.session_token=<登录时 Set-Cookie 响应头中的完整值，含 .签名>
```

> ⚠️ 必须使用 `Set-Cookie` 中的完整值，不是 JSON 响应体中的 `token` 字段。推荐用 `-b tmp/cookies.txt` 方式。

**成功返回**（HTTP 200，已登录）：
```json
{
  "session": {
    "id": "nBOKlnXhca5B4DbXGqDe09R3V8LeaNin",
    "expiresAt": "2026-02-25T13:58:29.558Z",
    "token": "oNkdVUMX5BH9DvOozdhYMytK4PTLph82",
    "createdAt": "2026-02-18T13:58:29.558Z",
    "updatedAt": "2026-02-18T13:58:29.558Z",
    "ipAddress": "",
    "userAgent": "curl/8.7.1",
    "userId": "gpSBZwZ6TukPWxGh4X3WRJPACAKaXF91"
  },
  "user": {
    "id": "gpSBZwZ6TukPWxGh4X3WRJPACAKaXF91",
    "name": "测试用户",
    "email": "test@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2026-02-18T13:57:49.260Z",
    "updatedAt": "2026-02-18T13:57:49.260Z"
  }
}
```

**未登录返回**（HTTP 200）：
```json
null
```

**curl 示例**：
```bash
# 方式一：使用之前保存的 tmp/cookies.txt 文件
curl http://localhost:3000/api/auth/get-session -b tmp/cookies.txt

# 方式二：手动传递 Cookie 值（从登录响应的 Set-Cookie 头中复制）
curl http://localhost:3000/api/auth/get-session \
  -H "Cookie: better-auth.session_token=<从登录响应中复制的完整值>"
```

---

### POST /api/auth/sign-out

退出登录，清除会话 Cookie。

**请求头**：
```
Cookie: better-auth.session_token=<当前会话的cookie值>
```

> 推荐用 `-b tmp/cookies.txt` 方式传递 Cookie。

**成功返回**（HTTP 200）：
```json
{
  "success": true
}
```

**响应头**（清除 Cookie）：
```
set-cookie: better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax
set-cookie: better-auth.session_data=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax
set-cookie: better-auth.dont_remember=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax
```

> `Max-Age=0` 表示立即过期，浏览器会自动清除这些 Cookie。

**curl 示例**：
```bash
curl -X POST http://localhost:3000/api/auth/sign-out -b tmp/cookies.txt
```

---

## 手动验证完整流程

以下是从零开始的完整验证步骤：

### 前置条件
1. 确保 `.env` 中配置了 `DATABASE_URL`、`AUTH_SECRET`、`BETTER_AUTH_URL`
2. 确保已执行数据库迁移（`npx drizzle-kit generate && npx drizzle-kit migrate`）

### 步骤

```bash
# 1. 启动服务
npm run build && node dist/main.js

# 2. 健康检查
curl http://localhost:3000/health
# 预期：{"status":"ok","timestamp":"...","database":"connected"}

# 3. 注册用户
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com","password":"Test123456!"}'
# 预期：返回 { token, user: { id, name, email, ... } }

# 4. 登录（保存 Cookie）
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!"}' \
  -c tmp/cookies.txt
# 预期：返回用户信息，tmp/cookies.txt 中保存了会话 Cookie

# 5. 获取会话（验证 Cookie 认证）
curl http://localhost:3000/api/auth/get-session -b tmp/cookies.txt
# 预期：返回 { session: {...}, user: {...} }

# 6. 登出
curl -X POST http://localhost:3000/api/auth/sign-out -b tmp/cookies.txt
# 预期：返回 { "success": true }

# 7. 验证登出生效
curl http://localhost:3000/api/auth/get-session -b tmp/cookies.txt
# 预期：返回 null（会话已失效）

# 8. 清理（可选）：停止服务后删除临时文件
rm -f tmp/cookies.txt
```
