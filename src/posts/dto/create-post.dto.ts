/** 发帖请求体。 */
export class CreatePostDto {
  content!: string;
  /** 已上传媒体的公开 URL 数组 */
  mediaUrls?: string[];
}
