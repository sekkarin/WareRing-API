import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService extends ConsoleLogger {
  log(message: any, context?: string) {
    let entry = '';
    if (context) {
      super.log(message, context);
      entry = `level:info\t${context}\t${message}`;
    } else {
      entry = `level:info\t${message}`;
      super.log(message);
    }
    this.logFile(entry);
  }
  error(message: any, stackOrContext?: string) {
    const entry = `level:error\t${stackOrContext}\t${message}`;
    this.logFile(entry);
    super.error(message, stackOrContext);
  }
  verbose(message: any, context?: string) {
    let entry = '';
    if (context) {
      super.verbose(message, context);
      entry = `level:verbose\t${context}\t${message}`;
    } else {
      entry = `level:verbose\t${message}`;
      super.verbose(message);
    }
    this.logFile(entry);
  }
  warn(message: any, context?: string) {
    let entry = '';
    if (context) {
      super.warn(message, context);
      entry = `level:verbose\t${context}\t${message}`;
    } else {
      entry = `level:verbose\t${message}`;
      super.warn(message);
    }
    this.logFile(entry);
  }
  fatal(message: any, stackOrContext?: string) {
    const entry = `level:fatal\t${stackOrContext}\t${message}`;
    this.logFile(entry);
    super.error(message, stackOrContext);
  }

  async logFile(entry: string) {
    const formattedEntry = `${Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Asia/Bangkok',
    }).format(new Date())}\t${entry}\n`;
    try {
      if (!fs.existsSync(path.join(__dirname, '..', '..', '..', 'logs'))) {
        await fsPromises.mkdir(path.join(__dirname, '..', '..', '..', 'logs'));
      }
      await fsPromises.appendFile(
        path.join(__dirname, '..', '..', '..', 'logs', 'loggerFile.log'),
        formattedEntry,
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }
}
