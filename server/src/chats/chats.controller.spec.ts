import { Test, TestingModule } from '@nestjs/testing';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Types } from 'mongoose';
import { Request } from 'express';

describe('ChatsController', () => {
    let controller: ChatsController;
    let chatsService: jest.Mocked<ChatsService>;

    const mockUserId = new Types.ObjectId();
    const mockParticipantId = new Types.ObjectId();
    const mockChatId = new Types.ObjectId();

    const mockChat = {
        _id: mockChatId,
        participants: [
            { _id: mockUserId, username: 'user1' },
            { _id: mockParticipantId, username: 'user2' },
        ],
    };

    const mockRequest = {
        UserData: {
            sub: mockUserId.toString(),
            username: 'user1',
        },
    } as unknown as Request;

    beforeEach(async () => {
        const mockChatsService = {
            createChat: jest.fn(),
            getChatsForUser: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ChatsController],
            providers: [{ provide: ChatsService, useValue: mockChatsService }],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ChatsController>(ChatsController);
        chatsService = module.get(ChatsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createChat', () => {
        it('should create a new chat', async () => {
            const createChatDto = { participantId: mockParticipantId.toString() };
            chatsService.createChat.mockResolvedValue(mockChat as any);

            const result = await controller.createChat(createChatDto, mockRequest);

            expect(chatsService.createChat).toHaveBeenCalled();
            expect(result).toEqual(mockChat);
        });

        it('should propagate errors from service', async () => {
            const createChatDto = { participantId: mockParticipantId.toString() };
            const error = new Error('Chat creation failed');
            chatsService.createChat.mockRejectedValue(error);

            await expect(controller.createChat(createChatDto, mockRequest)).rejects.toThrow('Chat creation failed');
        });
    });

    describe('getUserChats', () => {
        it('should return chats for current user', async () => {
            const chats = [mockChat];
            chatsService.getChatsForUser.mockResolvedValue(chats as any);

            const result = await controller.getUserChats(mockRequest);

            expect(chatsService.getChatsForUser).toHaveBeenCalled();
            expect(result).toEqual(chats);
        });

        it('should return empty array when user has no chats', async () => {
            chatsService.getChatsForUser.mockResolvedValue([]);

            const result = await controller.getUserChats(mockRequest);

            expect(result).toEqual([]);
        });
    });
});
