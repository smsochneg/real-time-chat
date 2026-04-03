import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req: Request = context.switchToHttp().getRequest();
        const authCookie = req.cookies['access_token'] as string;

        if (!authCookie) throw new UnauthorizedException();

        try {
            const result = await this.authService.validateAuthToken(authCookie);

            req.UserData = result;

            return true;
        } catch {
            throw new UnauthorizedException();
        }
    }
}
