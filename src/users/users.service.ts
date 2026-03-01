import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.provider';
import { user } from '../database/schema';
import { FollowsService } from '../follows/follows.service';

/**
 * 用户信息业务服务。
 */
@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly followsService: FollowsService,
  ) {}

  /** 当前登录用户完整信息（含 email、关注数、粉丝数）。 */
  async getMe(userId: string) {
    const [u] = await this.db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!u) {
      throw new NotFoundException('用户不存在');
    }

    // 获取关注数和粉丝数
    const followingCount = await this.followsService.getFollowingCount(userId);
    const followersCount = await this.followsService.getFollowersCount(userId);

    return {
      ...u,
      followingCount,
      followersCount,
    };
  }

  /** 他人用户信息，脱敏（不返回 email），含关注数、粉丝数、是否已关注。 */
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

    // 获取关注数和粉丝数
    const followingCount = await this.followsService.getFollowingCount(targetId);
    const followersCount = await this.followsService.getFollowersCount(targetId);

    // 检查是否已关注
    const isFollowing = await this.followsService.isFollowing(
      currentUserId,
      targetId,
    );

    return {
      ...u,
      followingCount,
      followersCount,
      isFollowing,
    };
  }
}