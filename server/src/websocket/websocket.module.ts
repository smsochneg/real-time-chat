import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { MessagesModule } from 'src/messages/messages.module';
import { ChatsModule } from 'src/chats/chats.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [MessagesModule, ChatsModule, AuthModule],
    providers: [WebsocketGateway],
    exports: [WebsocketGateway],
})
export class WebsocketModule {}
