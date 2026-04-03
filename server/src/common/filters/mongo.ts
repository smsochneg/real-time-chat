import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, Logger } from '@nestjs/common';

import { MongooseError } from 'mongoose';
import { MongoError } from 'mongodb';
import { Response } from 'express';

@Catch(MongooseError)
export class MongooseExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(MongooseExceptionFilter.name);
    catch(exception: MongooseError, host: ArgumentsHost) {
        this.logger.error(`MongooseError: ${exception.message}`, exception);
        switch (exception.name) {
            case 'ValidationError': {
                throw new BadRequestException(exception.message);
            }
        }
        const ctx = host.switchToHttp();

        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        response.status(500).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(MongoExceptionFilter.name);
    catch(exception: MongoError, host: ArgumentsHost) {
        this.logger.error(`MongoExceptionFilter: ${exception.message}`, exception);
        const ctx = host.switchToHttp();

        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        response.status(500).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
