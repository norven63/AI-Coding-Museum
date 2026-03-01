/**
 * 发表评论/回复的请求体
 */
export class CreateCommentDto {
  /** 评论内容 */
  content!: string;
  /** 父评论 ID（回复时必填） */
  parentId?: string;
}