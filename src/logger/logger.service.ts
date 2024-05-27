import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { createLogger, format } from 'winston';
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new winston.transports.File({ filename: './logs/combined.log' }),
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
  ],
});
@Injectable()
export class LoggerService extends ConsoleLogger {
  log(message: any, context?: string) {
    logger.info(message, context);
    super.log(message, context);
  }
  error(message: any, stackOrContext?: string) {
    logger.error(message, stackOrContext);
    super.error(message, stackOrContext);
  }
  verbose(message: any, context?: string) {
    logger.verbose(message, context);
    super.log(message, context);
  }
  warn(message: any, context?: string) {
    logger.warn(message, context);
    super.log(message, context);
  }
  fatal(message: any, stackOrContext?: string) {
    logger.crit(message, stackOrContext);
    super.error(message, stackOrContext);
  }

}
