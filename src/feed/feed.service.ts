import { Inject, Injectable } from '@nestjs/common';
import { eq, and, lt, desc, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.provider';
import { post, user, follow } from '../database/schema';

/**
 * 关注时间流服务
 */
@Injectable()
export class FeedService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  /**
   * 获取关注时间流
   * 仅返回已关注用户的帖子，按时间倒序
   */
  async getFollowingFeed(userId: string, limit = 10, cursor?: string) {
    // 获取关注列表
    const followingRows = await this.db
      .select({ followingId: follow.followingId })
      .from(follow)
      .where(eq(follow.followerId, userId));

    const followingIds = followingRows.map((r: any) => r.followingId);

    // 如果没有关注任何人，返回空数组
    if (followingIds.length === 0) {
      return [];
    }

    // 构建查询
    const take = Math.min(Math.max(1, limit), 50);

    let query = this.db
      .select({
        id: post.id,
        userId: post.userId,
        content: post.content,
        mediaUrls: post.mediaUrls,
        createdAt: post.createdAt,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(post)
      .leftJoin(user, eq(post.userId, user.id))
      .where(inArray(post.userId, followingIds))
      .orderBy(desc(post.createdAt))
      .limit(take);

    // 如果有游标，获取该游标帖子的时间，然后查询更早的帖子
    if (cursor) {
      const [cursorPost] = await this.db
        .select()
        .from(post)
        .where(eq(post.id, cursor))
        .limit(1);

      if (cursorPost) {
        query = this.db
          .select({
            id: post.id,
            userId: post.userId,
            content: post.content,
            mediaUrls: post.mediaUrls,
            createdAt: post.createdAt,
            authorName: user.name,
            authorImage: user.image,
          })
          .from(post)
          .leftJoin(user, eq(post.userId, user.id))
          .where(
            and(
              inArray(post.userId, followingIds),
              lt(post.createdAt, cursorPost.createdAt),
            ),
          )
          .orderBy(desc(post.createdAt))
          .limit(take);
      }
    }

    return query;
  }
}