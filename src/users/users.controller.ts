import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';
import { FollowsService } from '../follows/follows.service';

/** 用户信息接口，均需登录。 */
@Controller('api/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly followsService: FollowsService,
  ) {}

  @Get('me')
  async getMe(@Req() req: Request & { session: { user: { id: string } } }) {
    return this.usersService.getMe(req.session.user.id);
  }

  /**
   * 关注用户
   * POST /api/users/:id/follow
   */
  @Post(':id/follow')
  async followUser(
    @Param('id') targetUserId: string,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    return this.followsService.followUser(
      req.session.user.id,
      targetUserId,
    );
  }

  /**
   * 取消关注
   * DELETE /api/users/:id/follow
   */
  @Delete(':id/follow')
  async unfollowUser(
    @Param('id') targetUserId: string,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    return this.followsService.unfollowUser(
      req.session.user.id,
      targetUserId,
    );
  }

  /**
   * 获取关注列表
   * GET /api/users/:id/following
   */
  @Get(':id/following')
  async getFollowing(
    @Param('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.followsService.getFollowing(
      userId,
      isNaN(parsedLimit) ? 20 : Math.min(parsedLimit, 50),
      isNaN(parsedOffset) ? 0 : parsedOffset,
    );
  }

  /**
   * 获取粉丝列表
   * GET /api/users/:id/followers
   */
  @Get(':id/followers')
  async getFollowers(
    @Param('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.followsService.getFollowers(
      userId,
      isNaN(parsedLimit) ? 20 : Math.min(parsedLimit, 50),
      isNaN(parsedOffset) ? 0 : parsedOffset,
    );
  }

  /**
   * 获取用户信息（放在最后，避免拦截其他路由）
   */
  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    return this.usersService.getById(req.session.user.id, id);
  }
}