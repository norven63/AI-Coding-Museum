import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [AuthModule],
  controllers: [PostsController],
  providers: [PostsService, AuthGuard],
})
export class PostsModule {}
