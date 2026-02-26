import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

/**
 * 会话鉴权守卫，校验请求是否携带有效 Cookie 会话。
 * 未登录或会话过期时抛出 UNAUTHORIZED，供需登录接口复用。
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined && v !== null) {
        headers.set(k, Array.isArray(v) ? v.join(', ') : String(v));
      }
    }
    const session = await this.authService.auth.api.getSession({
      headers,
    });

    if (!session) {
      throw new UnauthorizedException('未登录或会话已过期');
    }

    (req as Request & { session: typeof session }).session = session;
    return true;
  }
}
