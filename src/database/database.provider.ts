import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/** Drizzle 实例注入令牌，业务模块通过 @Inject(DRIZZLE) 获取。 */
export const DRIZZLE = Symbol('DRIZZLE');

/** Drizzle + Neon HTTP 驱动工厂，依赖 DATABASE_URL。 */
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
