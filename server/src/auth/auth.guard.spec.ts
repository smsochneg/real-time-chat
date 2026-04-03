import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('AuthGuard', () => {
    let guard: AuthGuard;
    let authService: jest.Mocked<AuthService>;

    const mockUserId = new Types.ObjectId();
    const mockJwtPayload = {
        sub: mockUserId.toString(),
        username: 'testuser',
    };

    beforeEach(async () => {
        const mockAuthService = {
            validateAuthToken: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthGuard, { provide: AuthService, useValue: mockAuthService }],
        }).compile();

        guard = module.get<AuthGuard>(AuthGuard);
        authService = module.get(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    const createMockExecutionContext = (cookies: Record<string, string> = {}): ExecutionContext => {
        const mockRequest = {
            cookies,
            UserData: undefined,
        };

        return {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
        } as unknown as ExecutionContext;
    };

    describe('canActivate', () => {
        it('should return true and set UserData for valid token', async () => {
            const context = createMockExecutionContext({ access_token: 'valid-token' });
            authService.validateAuthToken.mockResolvedValue(mockJwtPayload);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(authService.validateAuthToken).toHaveBeenCalledWith('valid-token');

            const request = context.switchToHttp().getRequest();
            expect(request.UserData).toEqual(mockJwtPayload);
        });

        it('should throw UnauthorizedException when no access_token cookie', async () => {
            const context = createMockExecutionContext({});

            await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when token validation fails', async () => {
            const context = createMockExecutionContext({ access_token: 'invalid-token' });
            authService.validateAuthToken.mockRejectedValue(new Error('Invalid token'));

            await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when access_token is empty', async () => {
            const context = createMockExecutionContext({ access_token: '' });

            await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
        });
    });
});
