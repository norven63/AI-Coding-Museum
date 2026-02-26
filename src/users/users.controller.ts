import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';

/** 用户信息接口，均需登录。 */
@Controller('api/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: Request & { session: { user: { id: string } } }) {
    return this.usersService.getMe(req.session.user.id);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    return this.usersService.getById(req.session.user.id, id);
  }
}
