import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WinstonLoggerService } from 'src/logger/logger.service';

@Injectable()
export class CustomLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: WinstonLoggerService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';

    const logContext = {
      ip,
      method,
      originalUrl,
      userAgent,
    };

    this.logger.log(
      `Incoming request: ${method} ${originalUrl} from IP: ${ip}`,
      JSON.stringify(logContext),
    );

    return next.handle().pipe(
      tap({
        error: (error) => {
          this.logger.error(
            `Error response for: ${method} ${originalUrl} from IP: ${ip}`,
            error,
            JSON.stringify(logContext),
          );
        },
      }),
    );
  }
}
