import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { EventType, MessageType, type Socket } from 'src/common/types/websocket';

import { AuthService } from 'src/auth/auth.service';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JoinChatSocketEventDto, LeaveChatSocketEventDto } from './dto/websocket.dto';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatCreatedEvent } from 'src/events/chats.event';
import { parseCookie } from 'cookie';
import { MessageSavedEvent } from 'src/events/messages.event';
import { ChatsHandlers } from 'src/chats/chats.handlers';

@WebSocketGateway({})
@UsePipes(
    new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory(errors) {
            return new WsException({
                status: 'validation_error',
                message: 'Invalid WebSocket payload',
                errors: errors.map((err) => ({
                    field: err.property,
                    constraints: err.constraints,
                })),
            });
        },
    }),
)
@UseGuards(WsAuthGuard)
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(WebsocketGateway.name);
    constructor(
        private authService: AuthService,
        private chatsHandlers: ChatsHandlers,
    ) {}

    async checkAuth(client: Socket) {
        try {
            const cookies = client.handshake.headers.cookie || '';
            const parsed = parseCookie(cookies);
            const token = parsed['access_token'] || '';
            const user = await this.authService.validateAuthToken(token);

            client.data.UserData = user;
        } catch (e) {
            this.logger.error(`Websocket authorization failed: ${e}`);
            client.emit('error', { message: 'Unauthorized', code: 'UNAUTHORIZED' });
            client.disconnect();
        }
    }
    async handleConnection(client: Socket) {
        await this.checkAuth(client);

        const userId = client.data.UserData.sub;
        if (userId) {
            await client.join(`user:${userId}`);
        }
        this.logger.log(`Client connected: ${client.id}, ${userId}`);
    }

    async handleDisconnect(client: Socket) {
        const rooms = Array.from(client.rooms);
        for (const room of rooms) {
            if (room !== client.id) {
                await client.leave(room);
                this.logger.debug(`Client ${client.id} left room: ${room}`);
            }
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @WebSocketServer()
    server: Server;

    @SubscribeMessage(MessageType.CHAT_JOIN)
    async joinChat(@MessageBody() body: JoinChatSocketEventDto, @ConnectedSocket() client: Socket) {
        await this.chatsHandlers.handleJoin(client, this.server, body);
    }

    @SubscribeMessage(MessageType.CHAT_LEAVE)
    async leaveChat(@MessageBody() body: LeaveChatSocketEventDto, @ConnectedSocket() client: Socket) {
        await this.chatsHandlers.handleLeave(client, this.server, body);
    }

    @OnEvent(EventType.CHAT_CREATED)
    handleChatCreated(event: ChatCreatedEvent) {
        const chat = event.chat;

        for (const participant of chat.participants) {
            this.server.to(`user:${participant.id.toString()}`).emit(MessageType.CHAT_CREATED, chat);
        }
    }
    @OnEvent(EventType.MESSAGE_SAVED)
    handleMessageSaved(event: MessageSavedEvent) {
        const message = event.message;
        this.server.to(`chat:${message.chatId.toString()}`).emit(MessageType.MESSAGE_BROADCAST, message);
    }
}
