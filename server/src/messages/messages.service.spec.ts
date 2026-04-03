import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { getModelToken } from '@nestjs/mongoose';
import { MessageModel } from './messages.schema';
import { ChatsService } from 'src/chats/chats.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { EventType } from 'src/common/types/websocket';

describe('MessagesService', () => {
    let service: MessagesService;
    let mockMessageModel: any;
    let chatsService: jest.Mocked<ChatsService>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    const mockUserId = new Types.ObjectId();
    const mockChatId = new Types.ObjectId();
    const mockMessageId = new Types.ObjectId();

    const mockUser = {
        _id: mockUserId,
        username: 'testuser',
    };

    const mockMessage = {
        _id: mockMessageId,
        chatId: mockChatId,
        sender: mockUserId,
        message: 'Hello, world!',
        createdAt: new Date(),
        populate: jest.fn(),
    };

    beforeEach(async () => {
        const mockModel = {
            find: jest.fn(),
            findOne: jest.fn(),
        };

        const MockMessageModelConstructor = jest.fn().mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({
                ...mockMessage,
                populate: jest.fn().mockResolvedValue({
                    ...mockMessage,
                    sender: mockUser,
                }),
            }),
        }));

        Object.assign(MockMessageModelConstructor, mockModel);

        const mockChatsService = {
            isAuthorizedForChat: jest.fn(),
        };

        const mockEventEmitter = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessagesService,
                { provide: getModelToken(MessageModel.name), useValue: MockMessageModelConstructor },
                { provide: ChatsService, useValue: mockChatsService },
                { provide: EventEmitter2, useValue: mockEventEmitter },
            ],
        }).compile();

        service = module.get<MessagesService>(MessagesService);
        mockMessageModel = module.get(getModelToken(MessageModel.name));
        chatsService = module.get(ChatsService);
        eventEmitter = module.get(EventEmitter2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendMessageToChat', () => {
        const sendMessageData = {
            chatId: mockChatId,
            sender: mockUserId,
            message: 'Hello, world!',
        };

        it('should send a message and emit event', async () => {
            chatsService.isAuthorizedForChat.mockResolvedValue(true);

            const result = await service.sendMessageToChat(sendMessageData);

            expect(chatsService.isAuthorizedForChat).toHaveBeenCalledWith(mockChatId, mockUserId);
            expect(eventEmitter.emit).toHaveBeenCalledWith(EventType.MESSAGE_SAVED, expect.any(Object));
            expect(result).toBeDefined();
        });

        it('should throw error when user is not authorized', async () => {
            chatsService.isAuthorizedForChat.mockRejectedValue(new Error('User is not authorized'));

            await expect(service.sendMessageToChat(sendMessageData)).rejects.toThrow('User is not authorized');
        });
    });

    describe('getMessagesForChat', () => {
        const getMessagesData = {
            chatId: mockChatId,
            userId: mockUserId,
        };

        it('should return messages for a chat', async () => {
            const messages = [
                { ...mockMessage, sender: mockUser },
                { ...mockMessage, _id: new Types.ObjectId(), message: 'Another message', sender: mockUser },
            ];

            chatsService.isAuthorizedForChat.mockResolvedValue(true);
            mockMessageModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue(messages),
                    }),
                }),
            });

            const result = await service.getMessagesForChat(getMessagesData);

            expect(chatsService.isAuthorizedForChat).toHaveBeenCalledWith(mockChatId, mockUserId);
            expect(mockMessageModel.find).toHaveBeenCalledWith(
                { chatId: mockChatId },
                { sender: 1, chatId: 1, message: 1, createdAt: 1 },
            );
            expect(result).toEqual(messages);
        });

        it('should throw error when user is not authorized', async () => {
            chatsService.isAuthorizedForChat.mockRejectedValue(new Error('User is not authorized'));

            await expect(service.getMessagesForChat(getMessagesData)).rejects.toThrow('User is not authorized');
        });
    });

    describe('getMessagesStartingFrom', () => {
        const getMessagesData = {
            chatId: mockChatId,
            userId: mockUserId,
            messageId: mockMessageId,
        };

        it('should return messages after a specific message', async () => {
            const currentMessage = { ...mockMessage, createdAt: new Date('2024-01-01') };
            const newMessages = [
                { ...mockMessage, _id: new Types.ObjectId(), createdAt: new Date('2024-01-02'), sender: mockUser },
            ];

            chatsService.isAuthorizedForChat.mockResolvedValue(true);
            mockMessageModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(currentMessage),
            });
            mockMessageModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue(newMessages),
                    }),
                }),
            });

            const result = await service.getMessagesStartingFrom(getMessagesData);

            expect(chatsService.isAuthorizedForChat).toHaveBeenCalledWith(mockChatId, mockUserId);
            expect(result).toEqual(newMessages);
        });

        it('should return empty array when current message not found', async () => {
            chatsService.isAuthorizedForChat.mockResolvedValue(true);
            mockMessageModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const result = await service.getMessagesStartingFrom(getMessagesData);

            expect(result).toEqual([]);
        });

        it('should throw error when user is not authorized', async () => {
            chatsService.isAuthorizedForChat.mockRejectedValue(new Error('User is not authorized'));

            await expect(service.getMessagesStartingFrom(getMessagesData)).rejects.toThrow('User is not authorized');
        });
    });
});
