import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Types } from 'mongoose';
import { Response } from 'express';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: jest.Mocked<AuthService>;

    const mockUserId = new Types.ObjectId();
    const mockUser = {
        _id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
    };

    const mockResponse = {
        cookie: jest.fn(),
    } as unknown as Response;

    beforeEach(async () => {
        const mockAuthService = {
            authorize: jest.fn(),
            register: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'password123',
        };

        it('should login user and set cookie', async () => {
            const accessToken = 'jwt-access-token';
            authService.authorize.mockResolvedValue({
                user: mockUser as any,
                access_token: accessToken,
            });

            const result = await controller.login(loginDto, mockResponse);

            expect(authService.authorize).toHaveBeenCalledWith(loginDto);
            expect(mockResponse.cookie).toHaveBeenCalledWith('access_token', accessToken, { httpOnly: true });
            expect(result).toEqual(mockUser);
        });

        it('should propagate authorization errors', async () => {
            const error = new Error('Invalid credentials');
            authService.authorize.mockRejectedValue(error);

            await expect(controller.login(loginDto, mockResponse)).rejects.toThrow('Invalid credentials');
        });
    });

    describe('register', () => {
        const registerDto = {
            username: 'newuser',
            email: 'newuser@example.com',
            password: 'password123',
        };

        it('should register a new user', async () => {
            const createdUser = { ...mockUser, ...registerDto };
            authService.register.mockResolvedValue(createdUser as any);

            const result = await controller.register(registerDto);

            expect(authService.register).toHaveBeenCalledWith(registerDto);
            expect(result).toEqual(createdUser);
        });

        it('should propagate registration errors', async () => {
            const error = new Error('User already exists');
            authService.register.mockRejectedValue(error);

            await expect(controller.register(registerDto)).rejects.toThrow('User already exists');
        });
    });

    describe('check', () => {
        it('should return empty object for authenticated user', () => {
            const result = controller.check();
            expect(result).toEqual({});
        });
    });

    describe('logout', () => {
        it('should clear access_token cookie', () => {
            const result = controller.logout(mockResponse);

            expect(mockResponse.cookie).toHaveBeenCalledWith('access_token', null);
            expect(result).toEqual({});
        });
    });
});
