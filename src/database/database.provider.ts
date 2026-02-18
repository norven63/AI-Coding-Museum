import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');

export const DatabaseProvider = {
  provide: DRIZZLE,
  useFactory: () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL 环境变量未配置');
    }
    const sql = neon(databaseUrl);
    return drizzle(sql, { schema });
  },
};
