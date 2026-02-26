import { Injectable, Inject } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { DRIZZLE } from '../database/database.provider';
import * as schema from '../database/schema';

/**
 * BetterAuth 封装，提供邮箱密码注册/登录/会话管理。
 * 依赖 AUTH_SECRET、BETTER_AUTH_URL 环境变量。
 */
@Injectable()
export class AuthService {
  public readonly auth;

  constructor(@Inject(DRIZZLE) private readonly db: any) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error('AUTH_SECRET 环境变量未配置');
    }

    this.auth = betterAuth({
      database: drizzleAdapter(this.db, {
        provider: 'pg',
        schema,
      }),
      secret,
      baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
      emailAndPassword: {
        enabled: true,
      },
    });
  }
}
