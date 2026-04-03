import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let usersService: jest.Mocked<UsersService>;
    let jwtService: jest.Mocked<JwtService>;

    const mockUserId = new Types.ObjectId();
    const mockUser = {
        _id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
    };

    beforeEach(async () => {
        const mockUsersService = {
            getUserByEmail: jest.fn(),
            getUserPasswordById: jest.fn(),
            createUser: jest.fn(),
        };

        const mockJwtService = {
            verifyAsync: jest.fn(),
            signAsync: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get(UsersService);
        jwtService = module.get(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateAuthToken', () => {
        it('should validate and return JWT payload', async () => {
            const token = 'valid-token';
            const payload = { sub: mockUserId.toString(), username: 'testuser' };
            jwtService.verifyAsync.mockResolvedValue(payload);

            const result = await service.validateAuthToken(token);

            expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
            expect(result).toEqual(payload);
        });

        it('should throw error for invalid token', async () => {
            const token = 'invalid-token';
            jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

            await expect(service.validateAuthToken(token)).rejects.toThrow('Invalid token');
        });
    });

    describe('authorize', () => {
        const authorizeRequest = {
            email: 'test@example.com',
            password: 'password123',
        };

        it('should authorize user with valid credentials', async () => {
            const hashedPassword = 'hashed-password';
            const accessToken = 'jwt-access-token';

            usersService.getUserByEmail.mockResolvedValue(mockUser as any);
            usersService.getUserPasswordById.mockResolvedValue(hashedPassword);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            jwtService.signAsync.mockResolvedValue(accessToken);

            const result = await service.authorize(authorizeRequest);

            expect(usersService.getUserByEmail).toHaveBeenCalledWith(authorizeRequest.email);
            expect(usersService.getUserPasswordById).toHaveBeenCalledWith(mockUserId);
            expect(bcrypt.compare).toHaveBeenCalledWith(authorizeRequest.password, hashedPassword);
            expect(jwtService.signAsync).toHaveBeenCalledWith({
                sub: mockUserId,
                username: mockUser.username,
            });
            expect(result).toEqual({
                user: mockUser,
                access_token: accessToken,
            });
        });

        it('should throw UnauthorizedException when user not found', async () => {
            usersService.getUserByEmail.mockResolvedValue(null);

            await expect(service.authorize(authorizeRequest)).rejects.toThrow(UnauthorizedException);
            await expect(service.authorize(authorizeRequest)).rejects.toThrow('User not found');
        });

        it('should throw InternalServerErrorException when password not found', async () => {
            usersService.getUserByEmail.mockResolvedValue(mockUser as any);
            usersService.getUserPasswordById.mockResolvedValue(undefined);

            await expect(service.authorize(authorizeRequest)).rejects.toThrow(InternalServerErrorException);
            await expect(service.authorize(authorizeRequest)).rejects.toThrow('Error validating password');
        });

        it('should throw UnauthorizedException when passwords do not match', async () => {
            usersService.getUserByEmail.mockResolvedValue(mockUser as any);
            usersService.getUserPasswordById.mockResolvedValue('hashed-password');
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.authorize(authorizeRequest)).rejects.toThrow(UnauthorizedException);
            await expect(service.authorize(authorizeRequest)).rejects.toThrow('Passwords do not match');
        });
    });

    describe('register', () => {
        const registerRequest = {
            username: 'newuser',
            email: 'newuser@example.com',
            password: 'password123',
        };

        it('should register a new user', async () => {
            const createdUser = { ...mockUser, ...registerRequest };
            usersService.createUser.mockResolvedValue(createdUser as any);

            const result = await service.register(registerRequest);

            expect(usersService.createUser).toHaveBeenCalledWith(registerRequest);
            expect(result).toEqual(createdUser);
        });

        it('should propagate errors from usersService', async () => {
            const error = new Error('User creation failed');
            usersService.createUser.mockRejectedValue(error);

            await expect(service.register(registerRequest)).rejects.toThrow('User creation failed');
        });
    });
});
