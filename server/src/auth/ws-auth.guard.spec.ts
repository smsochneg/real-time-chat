import { Test, TestingModule } from '@nestjs/testing';
import { WsAuthGuard } from './ws-auth.guard';
import { AuthService } from './auth.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('WsAuthGuard', () => {
    let guard: WsAuthGuard;
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
            providers: [WsAuthGuard, { provide: AuthService, useValue: mockAuthService }],
        }).compile();

        guard = module.get<WsAuthGuard>(WsAuthGuard);
        authService = module.get(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    const createMockWsContext = (cookies: string = ''): { context: ExecutionContext; client: any } => {
        const mockClient = {
            handshake: {
                headers: {
                    cookie: cookies,
                },
            },
            data: {},
            emit: jest.fn(),
            disconnect: jest.fn(),
        };

        const context = {
            switchToWs: () => ({
                getClient: () => mockClient,
            }),
        } as unknown as ExecutionContext;

        return { context, client: mockClient };
    };

    describe('canActivate', () => {
        it('should return true and set UserData for valid token', async () => {
            const { context, client } = createMockWsContext('access_token=valid-token');
            authService.validateAuthToken.mockResolvedValue(mockJwtPayload);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(authService.validateAuthToken).toHaveBeenCalledWith('valid-token');
            expect(client.data.UserData).toEqual(mockJwtPayload);
        });

        it('should throw UnauthorizedException when no access_token cookie', async () => {
            const { context } = createMockWsContext('');

            await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
        });

        it('should return false, emit error and disconnect when token validation fails', async () => {
            const { context, client } = createMockWsContext('access_token=invalid-token');
            authService.validateAuthToken.mockRejectedValue(new Error('Invalid token'));

            const result = await guard.canActivate(context);

            expect(result).toBe(false);
            expect(client.emit).toHaveBeenCalledWith('error', {
                message: 'Unauthorized',
                code: 'UNAUTHORIZED',
            });
            expect(client.disconnect).toHaveBeenCalled();
        });

        it('should handle multiple cookies correctly', async () => {
            const { context, client } = createMockWsContext(
                'other_cookie=value; access_token=valid-token; another=test',
            );
            authService.validateAuthToken.mockResolvedValue(mockJwtPayload);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(authService.validateAuthToken).toHaveBeenCalledWith('valid-token');
            expect(client.data.UserData).toEqual(mockJwtPayload);
        });
    });
});
