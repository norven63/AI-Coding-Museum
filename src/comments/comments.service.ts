import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, desc, asc, isNull, isNotNull } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.provider';
import { comment, commentLike, post, user } from '../database/schema';

/** 最大嵌套深度 */
const MAX_DEPTH = 4; // 0-4 共 5 层

/** 评论树节点（含嵌套回复） */
export interface CommentTreeNode {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentId: string | null;
  depth: number;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  authorName: string | null;
  authorImage: string | null;
  isLiked: boolean;
  replies: CommentTreeNode[];
}

/**
 * 评论业务服务
 */
@Injectable()
export class CommentsService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  /**
   * 发表评论或回复
   */
  async create(
    userId: string,
    postId: string,
    content: string,
    parentId?: string,
  ) {
    // 检查帖子是否存在
    const [targetPost] = await this.db
      .select()
      .from(post)
      .where(eq(post.id, postId))
      .limit(1);

    if (!targetPost) {
      throw new NotFoundException('帖子不存在');
    }

    let depth = 0;
    let actualParentId = null;

    // 如果是回复，检查父评论并计算深度
    if (parentId) {
      const [parentComment] = await this.db
        .select()
        .from(comment)
        .where(and(eq(comment.id, parentId), eq(comment.postId, postId)))
        .limit(1);

      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }

      if (parentComment.deletedAt) {
        throw new BadRequestException('无法回复已删除的评论');
      }

      if (parentComment.depth >= MAX_DEPTH) {
        throw new BadRequestException('评论嵌套深度不能超过 5 层');
      }

      depth = parentComment.depth + 1;
      actualParentId = parentId;
    }

    const [created] = await this.db
      .insert(comment)
      .values({
        userId,
        postId,
        content: content.trim(),
        parentId: actualParentId,
        depth,
      })
      .returning();

    return created;
  }

  /**
   * 获取评论列表（树形结构）
   * 顶级评论按点赞数倒序，嵌套回复按时间正序
   */
  async findByPostId(postId: string, userId: string, limit = 20) {
    // 获取所有评论（含作者信息）
    const comments = await this.db
      .select({
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        content: comment.content,
        parentId: comment.parentId,
        depth: comment.depth,
        likeCount: comment.likeCount,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        deletedAt: comment.deletedAt,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(comment)
      .leftJoin(user, eq(comment.userId, user.id))
      .where(eq(comment.postId, postId))
      .orderBy(desc(comment.likeCount), asc(comment.createdAt));

    // 获取当前用户的点赞记录
    const commentIds = comments.map((c: any) => c.id);
    const likes =
      commentIds.length > 0
        ? await this.db
            .select()
            .from(commentLike)
            .where(
              and(
                eq(commentLike.userId, userId),
                // drizzle 不支持 inArray，用循环查询
              ),
            )
        : [];

    // 简化：查所有用户对此帖子的评论点赞
    const userLikes = await this.db
      .select()
      .from(commentLike)
      .where(eq(commentLike.userId, userId));

    const likedCommentIds = new Set(
      userLikes.map((l: any) => l.commentId),
    );

    // 构建树形结构
    const commentMap = new Map<string, CommentTreeNode>();
    const rootComments: CommentTreeNode[] = [];

    // 第一遍：创建所有节点
    for (const c of comments) {
      const node: CommentTreeNode = {
        id: c.id,
        postId: c.postId,
        userId: c.userId,
        content: c.deletedAt ? '该评论已删除' : c.content,
        parentId: c.parentId,
        depth: c.depth,
        likeCount: c.likeCount,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        deletedAt: c.deletedAt,
        authorName: c.deletedAt ? null : c.authorName,
        authorImage: c.deletedAt ? null : c.authorImage,
        isLiked: likedCommentIds.has(c.id),
        replies: [],
      };
      commentMap.set(c.id, node);
    }

    // 第二遍：建立父子关系
    for (const c of comments) {
      const node = commentMap.get(c.id)!;
      if (c.parentId && commentMap.has(c.parentId)) {
        commentMap.get(c.parentId)!.replies.push(node);
      } else if (c.depth === 0) {
        rootComments.push(node);
      }
    }

    // 对嵌套回复按时间正序排序
    const sortReplies = (nodes: CommentTreeNode[]) => {
      for (const node of nodes) {
        if (node.replies.length > 0) {
          node.replies.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          sortReplies(node.replies);
        }
      }
    };
    sortReplies(rootComments);

    // 顶级评论按点赞数倒序
    rootComments.sort(
      (a, b) => b.likeCount - a.likeCount || 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return rootComments.slice(0, limit);
  }

  /**
   * 点赞/取消点赞评论
   */
  async toggleLike(userId: string, commentId: string) {
    const [targetComment] = await this.db
      .select()
      .from(comment)
      .where(eq(comment.id, commentId))
      .limit(1);

    if (!targetComment) {
      throw new NotFoundException('评论不存在');
    }

    if (targetComment.deletedAt) {
      throw new BadRequestException('无法点赞已删除的评论');
    }

    const [existing] = await this.db
      .select()
      .from(commentLike)
      .where(
        and(
          eq(commentLike.userId, userId),
          eq(commentLike.commentId, commentId),
        ),
      )
      .limit(1);

    if (existing) {
      // 取消点赞
      await this.db
        .delete(commentLike)
        .where(
          and(
            eq(commentLike.userId, userId),
            eq(commentLike.commentId, commentId),
          ),
        );
      
      // 更新点赞计数
      await this.db
        .update(comment)
        .set({ likeCount: Math.max(0, targetComment.likeCount - 1) })
        .where(eq(comment.id, commentId));

      return { liked: false };
    } else {
      // 点赞
      await this.db.insert(commentLike).values({ userId, commentId });
      
      // 更新点赞计数
      await this.db
        .update(comment)
        .set({ likeCount: targetComment.likeCount + 1 })
        .where(eq(comment.id, commentId));

      return { liked: true };
    }
  }

  /**
   * 删除评论（软删除）
   * 仅作者或帖主可删除
   */
  async delete(userId: string, commentId: string) {
    const [targetComment] = await this.db
      .select()
      .from(comment)
      .where(eq(comment.id, commentId))
      .limit(1);

    if (!targetComment) {
      throw new NotFoundException('评论不存在');
    }

    if (targetComment.deletedAt) {
      throw new BadRequestException('评论已被删除');
    }

    // 检查权限：作者或帖主
    const [targetPost] = await this.db
      .select()
      .from(post)
      .where(eq(post.id, targetComment.postId))
      .limit(1);

    const isAuthor = targetComment.userId === userId;
    const isPostOwner = targetPost && targetPost.userId === userId;

    if (!isAuthor && !isPostOwner) {
      throw new ForbiddenException('无权删除此评论');
    }

    // 软删除
    await this.db
      .update(comment)
      .set({ deletedAt: new Date(), content: '', likeCount: 0 })
      .where(eq(comment.id, commentId));

    return { deleted: true };
  }
}