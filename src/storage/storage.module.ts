import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

/**
 * 对象存储模块。
 * 提供 R2 Presigned URL 生成能力，支持前端直传。
 */
@Module({
  imports: [AuthModule],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}