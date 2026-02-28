import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { StorageService } from './storage.service';

/** 存储接口，需登录。 */
@Controller('api/storage')
@UseGuards(AuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * 获取上传预签名 URL。
   * 前端获取 URL 后直接 PUT 上传文件到 R2。
   */
  @Get('upload-url')
  async getUploadUrl(
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
    @Req() req: Request & { session: { user: { id: string } } },
  ) {
    if (!filename || !contentType) {
      throw new BadRequestException('filename 和 contentType 参数必填');
    }

    const userId = req.session.user.id;
    return this.storageService.getUploadUrl(userId, filename, contentType);
  }
}