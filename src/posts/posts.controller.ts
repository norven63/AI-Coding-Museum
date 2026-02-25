import {
  Body,
  Controller,
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
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';
import { BadRequestException } from '@nestjs/common';

@Controller('api/posts')
@UseGuards(AuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePostDto,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    const content = dto?.content;
    if (content == null || typeof content !== 'string' || content.trim() === '') {
      throw new BadRequestException('content 不能为空');
    }
    const created = await this.postsService.create(
      req.session.user.id,
      content.trim(),
    );
    return created;
  }

  @Get()
  async findAll(
    @Query('cursor') cursor: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const rows = await this.postsService.findAll(
      req.session.user.id,
      cursor,
      isNaN(parsedLimit) ? 10 : parsedLimit,
    );
    return rows;
  }

  @Post(':id/like')
  async toggleLike(
    @Param('id') postId: string,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    return this.postsService.toggleLike(req.session.user.id, postId);
  }
}
