import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, desc, sql, lt } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.provider';
import { post, postLike, user } from '../database/schema';

/**
 * 帖子与点赞业务服务。
 */
@Injectable()
export class PostsService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  /** 发帖，返回新建的 post。 */
  async create(userId: string, content: string, mediaUrls?: string[]) {
    const [created] = await this.db
      .insert(post)
      .values({ userId, content, mediaUrls: mediaUrls || null })
      .returning();
    return created;
  }

  /** 时间流分页，按创建时间倒序。cursor 为上一页最后一条 id，limit 限制 1–50。 */
  async findAll(_userId: string, cursor?: string, limit = 10) {
    const take = Math.min(Math.max(1, limit), 50);

    if (cursor) {
      const [cursorPost] = await this.db
        .select()
        .from(post)
        .where(eq(post.id, cursor))
        .limit(1);
      if (cursorPost) {
        const rows = await this.db
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
          .where(lt(post.createdAt, cursorPost.createdAt))
          .orderBy(desc(post.createdAt))
          .limit(take);
        return rows;
      }
    }

    const rows = await this.db
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
      .orderBy(desc(post.createdAt))
      .limit(take);
    return rows;
  }

  /** 点赞/取消点赞（toggle），post 不存在时抛出 NotFoundException。 */
  async toggleLike(userId: string, postId: string) {
    const [target] = await this.db
      .select()
      .from(post)
      .where(eq(post.id, postId))
      .limit(1);

    if (!target) {
      throw new NotFoundException('帖子不存在');
    }

    const [existing] = await this.db
      .select()
      .from(postLike)
      .where(
        and(eq(postLike.userId, userId), eq(postLike.postId, postId)),
      )
      .limit(1);

    if (existing) {
      await this.db
        .delete(postLike)
        .where(
          and(eq(postLike.userId, userId), eq(postLike.postId, postId)),
        );
      return { liked: false };
    } else {
      await this.db.insert(postLike).values({ userId, postId });
      return { liked: true };
    }
  }
}
