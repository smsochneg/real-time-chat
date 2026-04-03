import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Types } from 'mongoose';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';

describe('UsersController', () => {
    let controller: UsersController;
    let usersService: jest.Mocked<UsersService>;

    const mockUserId = new Types.ObjectId();
    const mockUser = {
        _id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
    };

    const mockRequest = {
        UserData: {
            sub: mockUserId.toString(),
            username: 'testuser',
        },
    } as unknown as Request;

    beforeEach(async () => {
        const mockUsersService = {
            searchUsersByUsername: jest.fn(),
            getUserById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{ provide: UsersService, useValue: mockUsersService }],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<UsersController>(UsersController);
        usersService = module.get(UsersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getUser (search)', () => {
        it('should search users by username', async () => {
            const searchResults = [
                { _id: mockUserId, username: 'testuser' },
                { _id: new Types.ObjectId(), username: 'testuser2' },
            ];
            usersService.searchUsersByUsername.mockResolvedValue(searchResults as any);

            const result = await controller.getUser('test');

            expect(usersService.searchUsersByUsername).toHaveBeenCalledWith('test');
            expect(result).toEqual(searchResults);
        });

        it('should return empty array when no users found', async () => {
            usersService.searchUsersByUsername.mockResolvedValue([]);

            const result = await controller.getUser('nonexistent');

            expect(result).toEqual([]);
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user by id from request', async () => {
            usersService.getUserById.mockResolvedValue(mockUser as any);

            const result = await controller.getCurrentUset(mockRequest);

            expect(usersService.getUserById).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
        });

        it('should return null when user not found', async () => {
            usersService.getUserById.mockResolvedValue(null);

            const result = await controller.getCurrentUset(mockRequest);

            expect(result).toBeNull();
        });
    });
});
