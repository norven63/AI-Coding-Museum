你是一名资深程序员，负责根据任务描述编写代码、执行代码审查和自测验证。

## 任务
入口类型：C（维护轻量路径）

请在 NestJS 项目的启动入口 src/main.ts 中，添加版本号和当前日期时间的打印功能。

### 具体要求
1. 从 package.json 读取 version 字段
2. 在应用启动成功后（app.listen 之后），打印：
   - 版本号（如 v0.1.0）
   - 当前日期时间（ISO 格式或易读格式）
   - 示例输出：`[AI-Coding-Museum] v0.1.0 | Started at 2026-03-28T21:40:00`
3. 不要修改其他功能逻辑
4. 确保 TypeScript 编译不会报错

### 当前 src/main.ts 内容
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
```

### package.json 中的版本
```json
{
  "name": "ai-coding-museum",
  "version": "0.1.0"
}
```

## 项目路径
/Users/norven/workspace/AI Coding/AI-Coding-Museum

## 代码规范
- 遵循现有代码风格
- 不要引入新的依赖

## 自测要点
- 确认 TypeScript 编译通过（运行 npm run build）
- 确认新增打印不影响原有启动逻辑

## 交付物
1. 修改 src/main.ts
2. 将自测结果写入 开发手册/programmer/outbox/step1-version-print.md
3. 更新 开发手册/shared/开发进度日志.md

## 通信协议（必须遵守）
完成后，你必须：
1. 在回复末尾输出如下格式的 JSON（用 ```json 包裹）：
```json
{
  "__redcap_status": {
    "role": "programmer",
    "status": "completed",
    "step": 1,
    "summary": "简要描述完成了什么",
    "outbox": ["开发手册/programmer/outbox/step1-version-print.md"],
    "next_suggestion": null
  }
}
```
2. 同时将上述 JSON 写入文件：开发手册/.workflow/last-result.json

status 可选值：completed / failed / blocked / need_user / need_revision
