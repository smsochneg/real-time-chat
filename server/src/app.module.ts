import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { WebsocketModule } from './websocket/websocket.module';
import { toJSONPlugin } from './common/mongoose/toJson.plugin';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StoriesModule } from './stories/stories.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { Connection } from 'mongoose';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                return {
                    uri: configService.get('MONGODB_URI'),
                    connectionFactory: (connection: Connection) => {
                        connection.plugin(toJSONPlugin);
                        return connection;
                    },
                };
            },
            inject: [ConfigService],
        }),
        AuthModule,
        UsersModule,
        MessagesModule,
        ChatsModule,
        WebsocketModule,
        EventEmitterModule.forRoot(),
        StoriesModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggingMiddleware).forRoutes('*');
    }
}
