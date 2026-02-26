import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.provider';
import { user } from '../database/schema';

/**
 * 用户信息业务服务。
 */
@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  /** 当前登录用户完整信息（含 email）。 */
  async getMe(userId: string) {
    const [u] = await this.db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!u) {
      throw new NotFoundException('用户不存在');
    }
    return u;
  }

  /** 他人用户信息，脱敏（不返回 email）。 */
  async getById(currentUserId: string, targetId: string) {
    const [u] = await this.db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, targetId))
      .limit(1);
    if (!u) {
      throw new NotFoundException('用户不存在');
    }
    return u;
  }
}
