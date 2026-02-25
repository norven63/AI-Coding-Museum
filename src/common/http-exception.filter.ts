import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

const STATUS_TO_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  500: 'INTERNAL_SERVER_ERROR',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      let msg: unknown =
        typeof resp === 'string'
          ? resp
          : (resp as Record<string, unknown>)?.['message'] ?? message;
      if (Array.isArray(msg)) {
        msg = msg[0];
      }
      message = typeof msg === 'string' ? msg : String(msg ?? message);
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    const code = STATUS_TO_CODE[status] ?? 'INTERNAL_SERVER_ERROR';

    res.status(status).json({
      code,
      message: String(message),
    });
  }
}
