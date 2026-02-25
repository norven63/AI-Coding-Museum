import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.provider';
import { user } from '../database/schema';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

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
