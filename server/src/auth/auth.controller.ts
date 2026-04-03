import { Body, Controller, Get, Post, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthorizeRequestDto, RegisterRequestDto } from './dto/authorize.dto';
import type { Response } from 'express';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @UsePipes(new ValidationPipe())
    @Post('/login')
    async login(@Body() body: AuthorizeRequestDto, @Res({ passthrough: true }) res: Response) {
        const authResult = await this.authService.authorize(body);
        res.cookie('access_token', authResult.access_token, { httpOnly: true });

        return authResult.user;
    }

    @UsePipes(new ValidationPipe())
    @Post('/register')
    async register(@Body() body: RegisterRequestDto) {
        return await this.authService.register(body);
    }

    @UseGuards(AuthGuard)
    @Get('/check')
    check() {
        return {};
    }

    @Get('/logout')
    logout(@Res({ passthrough: true }) res: Response) {
        res.cookie('access_token', null);
        return {};
    }
}
