import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { FeedService } from './feed.service';

/** 关注时间流接口，均需登录。 */
@Controller('api/feed')
@UseGuards(AuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /**
   * 获取关注时间流
   * GET /api/feed/following
   */
  @Get('following')
  async getFollowingFeed(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Req() req?: Request & { session: { user: { id: string } } },
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;

    return this.feedService.getFollowingFeed(
      req!.session.user.id,
      isNaN(parsedLimit) ? 10 : parsedLimit,
      cursor,
    );
  }
}