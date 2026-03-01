import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.provider';
import { follow, user } from '../database/schema';

/**
 * 关注业务服务
 */
@Injectable()
export class FollowsService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  /**
   * 关注用户
   */
  async followUser(followerId: string, followingId: string) {
    // 禁止自己关注自己
    if (followerId === followingId) {
      throw new BadRequestException('不能关注自己');
    }

    // 检查目标用户是否存在
    const [targetUser] = await this.db
      .select()
      .from(user)
      .where(eq(user.id, followingId))
      .limit(1);

    if (!targetUser) {
      throw new BadRequestException('用户不存在');
    }

    // 检查是否已关注
    const [existing] = await this.db
      .select()
      .from(follow)
      .where(
        and(
          eq(follow.followerId, followerId),
          eq(follow.followingId, followingId),
        ),
      )
      .limit(1);

    if (existing) {
      // 已关注，幂等返回
      return { following: true };
    }

    // 创建关注关系
    await this.db.insert(follow).values({ followerId, followingId });

    return { following: true };
  }

  /**
   * 取消关注
   */
  async unfollowUser(followerId: string, followingId: string) {
    const [existing] = await this.db
      .select()
      .from(follow)
      .where(
        and(
          eq(follow.followerId, followerId),
          eq(follow.followingId, followingId),
        ),
      )
      .limit(1);

    if (existing) {
      await this.db
        .delete(follow)
        .where(
          and(
            eq(follow.followerId, followerId),
            eq(follow.followingId, followingId),
          ),
        );
    }

    return { following: false };
  }

  /**
   * 获取关注列表
   */
  async getFollowing(userId: string, limit = 20, offset = 0) {
    const rows = await this.db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: follow.createdAt,
      })
      .from(follow)
      .leftJoin(user, eq(follow.followingId, user.id))
      .where(eq(follow.followerId, userId))
      .orderBy(desc(follow.createdAt))
      .limit(limit)
      .offset(offset);

    return rows;
  }

  /**
   * 获取粉丝列表
   */
  async getFollowers(userId: string, limit = 20, offset = 0) {
    const rows = await this.db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: follow.createdAt,
      })
      .from(follow)
      .leftJoin(user, eq(follow.followerId, user.id))
      .where(eq(follow.followingId, userId))
      .orderBy(desc(follow.createdAt))
      .limit(limit)
      .offset(offset);

    return rows;
  }

  /**
   * 获取关注数
   */
  async getFollowingCount(userId: string): Promise<number> {
    const rows = await this.db
      .select()
      .from(follow)
      .where(eq(follow.followerId, userId));

    return rows.length;
  }

  /**
   * 获取粉丝数
   */
  async getFollowersCount(userId: string): Promise<number> {
    const rows = await this.db
      .select()
      .from(follow)
      .where(eq(follow.followingId, userId));

    return rows.length;
  }

  /**
   * 检查是否已关注
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      return false;
    }

    const [existing] = await this.db
      .select()
      .from(follow)
      .where(
        and(
          eq(follow.followerId, followerId),
          eq(follow.followingId, followingId),
        ),
      )
      .limit(1);

    return !!existing;
  }

  /**
   * 获取用户关注的所有用户 ID 列表
   */
  async getFollowingIds(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ followingId: follow.followingId })
      .from(follow)
      .where(eq(follow.followerId, userId));

    return rows.map((r: any) => r.followingId);
  }
}