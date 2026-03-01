/**
 * 查询评论列表的请求参数
 */
export class QueryCommentsDto {
  /** 每页数量，默认 20，最大 50 */
  limit?: number;
}