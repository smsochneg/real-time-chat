import { Injectable, Logger } from '@nestjs/common';
import { ChatsService } from './chats.service';

import { Types } from 'mongoose';
import { MessageType, type Socket } from 'src/common/types/websocket';
import { Server } from 'socket.io';
import { JoinChatSocketEventDto, LeaveChatSocketEventDto } from 'src/websocket/dto/websocket.dto';

@Injectable()
export class ChatsHandlers {
    private readonly logger = new Logger(ChatsHandlers.name);

    constructor(private readonly chatsService: ChatsService) {}

    async handleJoin(client: Socket, server: Server, dto: JoinChatSocketEventDto) {
        const { chatId } = dto;

        try {
            await this.chatsService.isAuthorizedForChat(
                new Types.ObjectId(chatId),
                new Types.ObjectId(client.data.UserData.sub),
            );
        } catch {
            client.emit('error', { message: 'Forbidden', code: 'FORBIDDEN' });
            return;
        }

        await client.join(`chat:${chatId}`);
        this.logger.debug(`Client ${client.id} joined chat: ${chatId}`);
        client.emit(MessageType.CHAT_JOINED, chatId);
    }

    async handleLeave(client: Socket, server: Server, dto: LeaveChatSocketEventDto) {
        const { chatId } = dto;

        await client.leave(`chat:${chatId}`);
        this.logger.debug(`Client ${client.id} left chat: ${chatId}`);
        client.emit(MessageType.CHAT_LEFT, chatId);
    }
}
