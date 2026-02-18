import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  private handler: (req: any, res: any) => Promise<void>;

  constructor(private readonly authService: AuthService) {
    this.handler = toNodeHandler(this.authService.auth);
  }

  @All()
  handleAuthRoot(@Req() req: Request, @Res() res: Response) {
    return this.handler(req, res);
  }

  @All('*path')
  handleAuth(@Req() req: Request, @Res() res: Response) {
    return this.handler(req, res);
  }
}
