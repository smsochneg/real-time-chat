import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { MongoExceptionFilter, MongooseExceptionFilter } from './common/filters';
import cookieParser from 'cookie-parser';
import { ConsoleLogger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new ConsoleLogger(),
    });

    const configService = app.get(ConfigService);

    app.use(cookieParser());
    app.useGlobalFilters(new MongooseExceptionFilter(), new MongoExceptionFilter());
    app.enableCors({
        origin: configService.get<string>('CORS_ORIGIN'),
        credentials: true,
    });

    const port = Number(configService.get<string>('PORT')) || 3000;
    await app.listen(port);
}
bootstrap();
