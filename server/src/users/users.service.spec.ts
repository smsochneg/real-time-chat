import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserModel } from './users.schema';
import { ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MongoError } from 'mongodb';

describe('UsersService', () => {
    let service: UsersService;
    let mockUserModel: any;

    const mockUserId = new Types.ObjectId();
    const mockUser = {
        _id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        save: jest.fn(),
    };

    beforeEach(async () => {
        const mockModel = {
            findOne: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            distinct: jest.fn(),
        };

        // Mock constructor for new this.userModel()
        const MockUserModelConstructor = jest.fn().mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(mockUser),
        }));

        Object.assign(MockUserModelConstructor, mockModel);

        const module: TestingModule = await Test.createTestingModule({
            providers: [UsersService, { provide: getModelToken(UserModel.name), useValue: MockUserModelConstructor }],
        }).compile();

        service = module.get<UsersService>(UsersService);
        mockUserModel = module.get(getModelToken(UserModel.name));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createUser', () => {
        const createUserDto = {
            username: 'newuser',
            email: 'newuser@example.com',
            password: 'password123',
        };

        it('should create a new user', async () => {
            const result = await service.createUser(createUserDto);

            expect(mockUserModel).toHaveBeenCalledWith({
                username: createUserDto.username,
                password: createUserDto.password,
                email: createUserDto.email,
            });
            expect(result).toEqual(mockUser);
        });

        it('should throw ConflictException when user already exists', async () => {
            const mongoError = new MongoError('Duplicate key error');
            mongoError.code = 11000;

            mockUserModel.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(mongoError),
            }));

            await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
            await expect(service.createUser(createUserDto)).rejects.toThrow('User already exists');
        });

        it('should rethrow non-duplicate key errors', async () => {
            const genericError = new Error('Database error');

            mockUserModel.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValue(genericError),
            }));

            await expect(service.createUser(createUserDto)).rejects.toThrow('Database error');
        });
    });

    describe('getUserByUsername', () => {
        it('should return user by username', async () => {
            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.getUserByUsername('testuser');

            expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'testuser' });
            expect(result).toEqual(mockUser);
        });

        it('should return null when user not found', async () => {
            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const result = await service.getUserByUsername('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('getUserByEmail', () => {
        it('should return user by email', async () => {
            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.getUserByEmail('test@example.com');

            expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(result).toEqual(mockUser);
        });

        it('should return null when user not found', async () => {
            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const result = await service.getUserByEmail('nonexistent@example.com');

            expect(result).toBeNull();
        });
    });

    describe('getUserPasswordById', () => {
        it('should return user password by id', async () => {
            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ password: 'hashedpassword' }),
            });

            const result = await service.getUserPasswordById(mockUserId);

            expect(mockUserModel.findOne).toHaveBeenCalledWith({ _id: mockUserId }, { password: 1 });
            expect(result).toBe('hashedpassword');
        });

        it('should return undefined when user not found', async () => {
            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const result = await service.getUserPasswordById(mockUserId);

            expect(result).toBeUndefined();
        });
    });

    describe('getUsersById', () => {
        it('should return users by ids', async () => {
            const userIds = [mockUserId, new Types.ObjectId()];
            const users = [mockUser, { ...mockUser, _id: userIds[1] }];

            mockUserModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(users),
            });

            const result = await service.getUsersById(userIds);

            expect(mockUserModel.find).toHaveBeenCalledWith({ _id: { $in: userIds } });
            expect(result).toEqual(users);
        });
    });

    describe('getUserById', () => {
        it('should return user by id', async () => {
            mockUserModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.getUserById(mockUserId);

            expect(mockUserModel.findById).toHaveBeenCalledWith(mockUserId);
            expect(result).toEqual(mockUser);
        });

        it('should return null when user not found', async () => {
            mockUserModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const result = await service.getUserById(mockUserId);

            expect(result).toBeNull();
        });
    });

    describe('getAllUsers', () => {
        it('should return all users with username only', async () => {
            const users = [
                { _id: mockUserId, username: 'user1' },
                { _id: new Types.ObjectId(), username: 'user2' },
            ];

            mockUserModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(users),
            });

            const result = await service.getAllUsers();

            expect(mockUserModel.find).toHaveBeenCalledWith({}, { username: 1 });
            expect(result).toEqual(users);
        });
    });

    describe('searchUsersByUsername', () => {
        it('should search users by username pattern', async () => {
            const users = [{ _id: mockUserId, username: 'testuser' }];

            mockUserModel.find.mockReturnValue({
                limit: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(users),
                }),
            });

            const result = await service.searchUsersByUsername('test');

            expect(mockUserModel.find).toHaveBeenCalledWith(
                { username: { $regex: 'test', $options: 'i' } },
                { username: 1 },
            );
            expect(result).toEqual(users);
        });

        it('should limit results to 10', async () => {
            const limitMock = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
            });

            mockUserModel.find.mockReturnValue({
                limit: limitMock,
            });

            await service.searchUsersByUsername('test');

            expect(limitMock).toHaveBeenCalledWith(10);
        });
    });
});
