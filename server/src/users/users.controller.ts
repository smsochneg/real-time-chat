import { Body, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Types } from 'mongoose';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}
    @Get('/search')
    async getUser(@Query('username') username: string) {
        return await this.usersService.searchUsersByUsername(username);
    }

    @Get('/current')
    async getCurrentUset(@Req() req: Request) {
        const id = new Types.ObjectId(req.UserData.sub);
        return await this.usersService.getUserById(id);
    }
}
