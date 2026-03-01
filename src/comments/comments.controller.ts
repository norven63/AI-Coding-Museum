import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto, QueryCommentsDto } from './dto';

/** 评论接口，均需登录。 */
@Controller('api')
@UseGuards(AuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * 发表评论/回复
   * POST /api/posts/:postId/comments
   */
  @Post('posts/:postId/comments')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    const created = await this.commentsService.create(
      req.session.user.id,
      postId,
      dto.content,
      dto.parentId,
    );
    return created;
  }

  /**
   * 获取评论列表（树形结构）
   * GET /api/posts/:postId/comments
   */
  @Get('posts/:postId/comments')
  async findByPostId(
    @Param('postId') postId: string,
    @Query() query: QueryCommentsDto,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    return this.commentsService.findByPostId(
      postId,
      req.session.user.id,
      query.limit,
    );
  }

  /**
   * 点赞/取消点赞评论
   * POST /api/comments/:id/like
   */
  @Post('comments/:id/like')
  async toggleLike(
    @Param('id') commentId: string,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    return this.commentsService.toggleLike(req.session.user.id, commentId);
  }

  /**
   * 删除评论
   * DELETE /api/comments/:id
   */
  @Delete('comments/:id')
  async delete(
    @Param('id') commentId: string,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    return this.commentsService.delete(req.session.user.id, commentId);
  }
}