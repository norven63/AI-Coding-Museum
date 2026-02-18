import { Injectable, Inject } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { DRIZZLE } from '../database/database.provider';
import * as schema from '../database/schema';

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
