import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { type Socket } from 'src/common/types/websocket';

import { parseCookie } from 'cookie';

@Injectable()
export class WsAuthGuard implements CanActivate {
    private readonly logger = new Logger(WsAuthGuard.name);
    constructor(private authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();
        const cookies = client.handshake.headers.cookie || '';
        const authCookie = parseCookie(cookies)['access_token'];

        if (!authCookie) throw new UnauthorizedException();

        try {
            const user = await this.authService.validateAuthToken(authCookie);

            client.data.UserData = user;
        } catch (e) {
            client.emit('error', { message: 'Unauthorized', code: 'UNAUTHORIZED' });
            client.disconnect();
            this.logger.error(`WebSocket connection unauthorized: ${e}`);
            return false;
        }

        return true;
    }
}
