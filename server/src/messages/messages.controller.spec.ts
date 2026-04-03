import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Types } from 'mongoose';
import { Request } from 'express';

describe('MessagesController', () => {
    let controller: MessagesController;
    let messagesService: jest.Mocked<MessagesService>;

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
        sender: mockUser,
        message: 'Hello, world!',
        createdAt: new Date(),
    };

    const mockRequest = {
        UserData: {
            sub: mockUserId.toString(),
            username: 'testuser',
        },
    } as unknown as Request;

    beforeEach(async () => {
        const mockMessagesService = {
            sendMessageToChat: jest.fn(),
            getMessagesForChat: jest.fn(),
            getMessagesStartingFrom: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [MessagesController],
            providers: [{ provide: MessagesService, useValue: mockMessagesService }],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<MessagesController>(MessagesController);
        messagesService = module.get(MessagesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('sendMessage', () => {
        it('should send a message', async () => {
            const sendMessageDto = {
                chatId: mockChatId.toString(),
                message: 'Hello, world!',
            };
            messagesService.sendMessageToChat.mockResolvedValue(mockMessage as any);

            const result = await controller.sendMessage(sendMessageDto, mockRequest);

            expect(messagesService.sendMessageToChat).toHaveBeenCalledWith({
                chatId: expect.any(Types.ObjectId),
                sender: expect.any(Types.ObjectId),
                message: 'Hello, world!',
            });
            expect(result).toEqual(mockMessage);
        });

        it('should propagate errors from service', async () => {
            const sendMessageDto = {
                chatId: mockChatId.toString(),
                message: 'Hello, world!',
            };
            const error = new Error('Failed to send message');
            messagesService.sendMessageToChat.mockRejectedValue(error);

            await expect(controller.sendMessage(sendMessageDto, mockRequest)).rejects.toThrow('Failed to send message');
        });
    });

    describe('getMessages', () => {
        it('should return messages for a chat', async () => {
            const messages = [mockMessage];
            messagesService.getMessagesForChat.mockResolvedValue(messages as any);

            const result = await controller.getMessages(mockChatId.toString(), mockRequest);

            expect(messagesService.getMessagesForChat).toHaveBeenCalledWith({
                chatId: expect.any(Types.ObjectId),
                userId: expect.any(Types.ObjectId),
            });
            expect(result).toEqual(messages);
        });

        it('should return empty array when no messages', async () => {
            messagesService.getMessagesForChat.mockResolvedValue([]);

            const result = await controller.getMessages(mockChatId.toString(), mockRequest);

            expect(result).toEqual([]);
        });
    });

    describe('getMessagesFrom', () => {
        it('should return messages after a specific message', async () => {
            const newMessages = [{ ...mockMessage, _id: new Types.ObjectId() }];
            messagesService.getMessagesStartingFrom.mockResolvedValue(newMessages as any);

            const result = await controller.getMessagesFrom(
                mockChatId.toString(),
                mockMessageId.toString(),
                mockRequest,
            );

            expect(messagesService.getMessagesStartingFrom).toHaveBeenCalledWith({
                chatId: expect.any(Types.ObjectId),
                userId: expect.any(Types.ObjectId),
                messageId: expect.any(Types.ObjectId),
            });
            expect(result).toEqual(newMessages);
        });

        it('should return empty array when no new messages', async () => {
            messagesService.getMessagesStartingFrom.mockResolvedValue([]);

            const result = await controller.getMessagesFrom(
                mockChatId.toString(),
                mockMessageId.toString(),
                mockRequest,
            );

            expect(result).toEqual([]);
        });
    });
});
