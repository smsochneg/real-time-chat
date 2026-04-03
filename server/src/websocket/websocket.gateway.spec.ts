import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketGateway } from './websocket.gateway';
import { AuthService } from 'src/auth/auth.service';
import { ChatsHandlers } from 'src/chats/chats.handlers';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { Types } from 'mongoose';
import { Server } from 'socket.io';
import { ChatCreatedEvent } from 'src/events/chats.event';
import { MessageSavedEvent } from 'src/events/messages.event';

describe('WebsocketGateway', () => {
    let gateway: WebsocketGateway;
    let authService: jest.Mocked<AuthService>;
    let chatsHandlers: jest.Mocked<ChatsHandlers>;

    const mockUserId = new Types.ObjectId();
    const mockChatId = new Types.ObjectId();

    const mockJwtPayload = {
        sub: mockUserId.toString(),
        username: 'testuser',
    };

    const createMockSocket = (cookies: string = '', rooms: string[] = []) => {
        const socketId = 'socket-id-123';
        // Socket.IO rooms is a Set that always includes the socket's own id
        const roomsSet = new Set([socketId, ...rooms]);
        return {
            id: socketId,
            handshake: {
                headers: {
                    cookie: cookies,
                },
            },
            data: {
                UserData: mockJwtPayload,
            },
            rooms: roomsSet,
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            disconnect: jest.fn(),
        };
    };

    const createMockServer = () => ({
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
    });

    beforeEach(async () => {
        const mockAuthService = {
            validateAuthToken: jest.fn(),
        };

        const mockChatsHandlers = {
            handleJoin: jest.fn(),
            handleLeave: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WebsocketGateway,
                { provide: AuthService, useValue: mockAuthService },
                { provide: ChatsHandlers, useValue: mockChatsHandlers },
            ],
        })
            .overrideGuard(WsAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        gateway = module.get<WebsocketGateway>(WebsocketGateway);
        authService = module.get(AuthService);
        chatsHandlers = module.get(ChatsHandlers);

        // Set up mock server
        gateway.server = createMockServer() as unknown as Server;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleConnection', () => {
        it('should authenticate client and join user room', async () => {
            const mockSocket = createMockSocket('access_token=valid-token');
            authService.validateAuthToken.mockResolvedValue(mockJwtPayload);

            await gateway.handleConnection(mockSocket as any);

            expect(mockSocket.join).toHaveBeenCalledWith(`user:${mockUserId.toString()}`);
        });

        it('should disconnect client on auth failure', async () => {
            const mockSocket = createMockSocket('access_token=invalid-token');
            authService.validateAuthToken.mockRejectedValue(new Error('Invalid token'));

            await gateway.handleConnection(mockSocket as any);

            expect(mockSocket.emit).toHaveBeenCalledWith('error', {
                message: 'Unauthorized',
                code: 'UNAUTHORIZED',
            });
            expect(mockSocket.disconnect).toHaveBeenCalled();
        });
    });

    describe('handleDisconnect', () => {
        it('should leave all rooms on disconnect', async () => {
            const userRoom = `user:${mockUserId.toString()}`;
            const chatRoom = `chat:${mockChatId.toString()}`;
            const mockSocket = createMockSocket('', [userRoom, chatRoom]);

            await gateway.handleDisconnect(mockSocket as any);

            // Should leave all rooms except the socket's own id
            expect(mockSocket.leave).toHaveBeenCalledWith(userRoom);
            expect(mockSocket.leave).toHaveBeenCalledWith(chatRoom);
            expect(mockSocket.leave).toHaveBeenCalledTimes(2);
        });

        it('should not leave socket own room', async () => {
            const mockSocket = createMockSocket();

            await gateway.handleDisconnect(mockSocket as any);

            // Should not try to leave the socket's own id room
            expect(mockSocket.leave).not.toHaveBeenCalledWith('socket-id-123');
        });
    });

    describe('joinChat', () => {
        it('should delegate to chatsHandlers.handleJoin', async () => {
            const mockSocket = createMockSocket();
            const joinChatDto = { chatId: mockChatId.toString() };

            await gateway.joinChat(joinChatDto as any, mockSocket as any);

            expect(chatsHandlers.handleJoin).toHaveBeenCalledWith(mockSocket, gateway.server, joinChatDto);
        });
    });

    describe('leaveChat', () => {
        it('should delegate to chatsHandlers.handleLeave', async () => {
            const mockSocket = createMockSocket();
            const leaveChatDto = { chatId: mockChatId.toString() };

            await gateway.leaveChat(leaveChatDto as any, mockSocket as any);

            expect(chatsHandlers.handleLeave).toHaveBeenCalledWith(mockSocket, gateway.server, leaveChatDto);
        });
    });

    describe('handleChatCreated', () => {
        it('should emit chat created event to all participants', () => {
            const mockChat = {
                _id: mockChatId,
                participants: [
                    { id: mockUserId, username: 'user1' },
                    { id: new Types.ObjectId(), username: 'user2' },
                ],
            };
            const event = new ChatCreatedEvent(mockChat as any);

            gateway.handleChatCreated(event);

            expect(gateway.server.to).toHaveBeenCalledTimes(2);
            expect(gateway.server.emit).toHaveBeenCalledWith('chat:created', mockChat);
        });
    });

    describe('handleMessageSaved', () => {
        it('should emit message to chat room', () => {
            const mockMessage = {
                _id: new Types.ObjectId(),
                chatId: mockChatId,
                sender: { _id: mockUserId, username: 'testuser' },
                message: 'Hello, world!',
                createdAt: new Date(),
            };
            const event = new MessageSavedEvent(mockMessage as any);

            gateway.handleMessageSaved(event);

            expect(gateway.server.to).toHaveBeenCalledWith(`chat:${mockChatId.toString()}`);
            expect(gateway.server.emit).toHaveBeenCalledWith('message:broadcast', mockMessage);
        });
    });
});
