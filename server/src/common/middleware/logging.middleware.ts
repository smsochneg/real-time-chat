import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction): void {
        const { method, originalUrl, ip } = req;
        const startTime = Date.now();

        const requestId = this.generateRequestId();
        req['requestId'] = requestId;

        this.logger.log(`[${requestId}] --> ${method} ${originalUrl} - ${ip}`);

        res.on('finish', () => {
            const { statusCode } = res;
            const contentLength = res.get('content-length') || 0;
            const duration = Date.now() - startTime;

            const logLevel = this.getLogLevel(statusCode);
            const message = `[${requestId}] <-- ${method} ${originalUrl} ${statusCode} ${contentLength}b - ${duration}ms`;

            switch (logLevel) {
                case 'error':
                    this.logger.error(message);
                    break;
                case 'warn':
                    this.logger.warn(message);
                    break;
                default:
                    this.logger.log(message);
            }
        });

        next();
    }

    private generateRequestId(): string {
        return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
    }

    private getLogLevel(statusCode: number): 'log' | 'warn' | 'error' {
        if (statusCode >= 500) return 'error';
        if (statusCode >= 400) return 'warn';
        return 'log';
    }
}
