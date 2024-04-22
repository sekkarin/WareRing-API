import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService extends ConsoleLogger {
  log(message: any, context?: string) {
    const entry = `${context}\t${message}`;
    this.logFile(entry);
    super.log(message, context);
  }

  error(message: any, stackOrContext?: string) {
    const entry = `${stackOrContext}\t${message}`;
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
      if (!fs.existsSync(path.join(__dirname, '..', '..', 'logs'))) {
        await fsPromises.mkdir(path.join(__dirname, '..', '..', 'logs'))
      }
      await fsPromises.appendFile(
        path.join(__dirname, '..', '..', 'logs', 'loggerFile.log'),
        formattedEntry,
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }
}
