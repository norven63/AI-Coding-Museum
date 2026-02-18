import { Controller, Get, Inject } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import { sql } from 'drizzle-orm';

@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  @Get()
  async check() {
    let database = 'disconnected';
    try {
      await this.db.execute(sql`SELECT 1`);
      database = 'connected';
    } catch {
      database = 'disconnected';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database,
    };
  }
}
