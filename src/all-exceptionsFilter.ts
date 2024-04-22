import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { LoggerService } from './logger/logger.service';
import { MongooseError } from 'mongoose';
import { Request, Response } from 'express';
type ResponseObjAllExceptions = {
  statusCode: number;
  timeStamp: string;
  path: string;
  response: string | object;
};
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new LoggerService(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const responseObj: ResponseObjAllExceptions = {
      statusCode: 200,
      response: '',
      path: request.url,
      timeStamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      responseObj.statusCode = exception.getStatus();
      responseObj.response = exception.getResponse();
    } else if (exception instanceof MongooseError) {
      responseObj.statusCode = 422;
      responseObj.response = exception.message.replace(/\n/g, '');
    } else {
      responseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      responseObj.response = 'Internal Server Error';
    }

    response.status(responseObj.statusCode).json(responseObj);
    this.logger.error(responseObj.response, AllExceptionsFilter.name);
    // super.catch(exception,host)
  }
}
