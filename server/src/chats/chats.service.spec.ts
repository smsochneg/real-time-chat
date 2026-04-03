import { Test, TestingModule } from '@nestjs/testing';
import { ChatsService } from './chats.service';
import { getModelToken } from '@nestjs/mongoose';
import { ChatsModel } from './chats.schema';
import { UsersService } from 'src/users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MongoError } from 'mongodb';
import { EventType } from 'src/common/types/websocket';

describe('ChatsService', () => {
    let service: ChatsService;
    let mockChatsModel: any;
    let usersService: jest.Mocked<UsersService>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    const mockUserId1 = new Types.ObjectId();
    const mockUserId2 = new Types.ObjectId();
    const mockChatId = new Types.ObjectId();

    const mockUsers = [
        { _id: mockUserId1, username: 'user1' },
        { _id: mockUserId2, username: 'user2' },
    ];

    const mockChat = {
        _id: mockChatId,
        participants: [mockUserId1, mockUserId2],
        populate: jest.fn(),
    };

    beforeEach(async () => {
        const mockModel = {
            find: jest.fn(),
            findOne: jest.fn(),
        };

        const MockChatsModelConstructor = jest.fn().mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({
                ...mockChat,
                populate: jest.fn().mockResolvedValue({
                    ...mockChat,
                    participants: mockUsers,
                }),
            }),
            populate: jest.fn(),
        }));

        Object.assign(MockChatsModelConstructor, mockModel);

        const mockUsersService = {
            getUsersById: jest.fn(),
        };

        const mockEventEmitter = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatsService,
                { provide: getModelToken(ChatsModel.name), useValue: MockChatsModelConstructor },
                { provide: UsersService, useValue: mockUsersService },
                { provide: EventEmitter2, useValue: mockEventEmitter },
            ],
        }).compile();

        service = module.get<ChatsService>(ChatsService);
        mockChatsModel = module.get(getModelToken(ChatsModel.name));
        usersService = module.get(UsersService);
        eventEmitter = module.get(EventEmitter2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getChatsForUser', () => {
        it('should return chats for a user', async () => {
            const populatedChats = [
                {
                    _id: mockChatId,
                    participants: mockUsers,
                },
            ];

            mockChatsModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(populatedChats),
                }),
            });

            const result = await service.getChatsForUser(mockUserId1);

            expect(mockChatsModel.find).toHaveBeenCalledWith({ participants: mockUserId1 });
            expect(result).toEqual(populatedChats);
        });

        it('should return empty array when user has no chats', async () => {
            mockChatsModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([]),
                }),
            });

            const result = await service.getChatsForUser(mockUserId1);

            expect(result).toEqual([]);
        });
    });

    describe('createChat', () => {
        it('should create a new chat and emit event', async () => {
            usersService.getUsersById.mockResolvedValue(mockUsers as any);

            const result = await service.createChat([mockUserId1, mockUserId2]);

            expect(usersService.getUsersById).toHaveBeenCalledWith([mockUserId1, mockUserId2]);
            expect(eventEmitter.emit).toHaveBeenCalledWith(EventType.CHAT_CREATED, expect.any(Object));
            expect(result).toBeDefined();
        });

        it('should throw ConflictException when chat already exists', async () => {
            usersService.getUsersById.mockResolvedValue(mockUsers as any);

            const mongoError = new MongoError('Duplicate key error');
            mongoError.code = 11000;

            mockChatsModel.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(mongoError),
            }));

            await expect(service.createChat([mockUserId1, mockUserId2])).rejects.toThrow(ConflictException);
            await expect(service.createChat([mockUserId1, mockUserId2])).rejects.toThrow('Chat already exists');
        });

        it('should rethrow non-duplicate key errors', async () => {
            usersService.getUsersById.mockResolvedValue(mockUsers as any);

            const genericError = new Error('Database error');

            mockChatsModel.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValue(genericError),
            }));

            await expect(service.createChat([mockUserId1, mockUserId2])).rejects.toThrow('Database error');
        });
    });

    describe('isAuthorizedForChat', () => {
        it('should return true when user is a participant', async () => {
            mockChatsModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({
                    _id: mockChatId,
                    participants: [mockUserId1, mockUserId2],
                }),
            });

            const result = await service.isAuthorizedForChat(mockChatId, mockUserId1);

            expect(mockChatsModel.findOne).toHaveBeenCalledWith({ _id: mockChatId });
            expect(result).toBe(true);
        });

        it('should throw NotFoundException when chat not found', async () => {
            mockChatsModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.isAuthorizedForChat(mockChatId, mockUserId1)).rejects.toThrow(NotFoundException);
            await expect(service.isAuthorizedForChat(mockChatId, mockUserId1)).rejects.toThrow('Chat not found');
        });

        it('should throw ForbiddenException when user is not a participant', async () => {
            const otherUserId = new Types.ObjectId();

            mockChatsModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({
                    _id: mockChatId,
                    participants: [mockUserId1, mockUserId2],
                }),
            });

            await expect(service.isAuthorizedForChat(mockChatId, otherUserId)).rejects.toThrow(ForbiddenException);
            await expect(service.isAuthorizedForChat(mockChatId, otherUserId)).rejects.toThrow(
                'User is not authorized',
            );
        });
    });
});
