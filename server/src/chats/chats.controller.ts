import { Body, Controller, Get, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatRequestDto } from './dto/user.create.dto';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('chats')
export class ChatsController {
    constructor(private readonly chatsService: ChatsService) {}

    @UsePipes(new ValidationPipe())
    @Post('/create')
    async createChat(@Body() body: CreateChatRequestDto, @Req() req: Request) {
        const chat = await this.chatsService.createChat([
            new Types.ObjectId(req.UserData.sub),
            new Types.ObjectId(body.participantId),
        ]);

        return chat;
    }

    @UsePipes(new ValidationPipe())
    @Get()
    async getUserChats(@Req() req: Request) {
        const chats = await this.chatsService.getChatsForUser(new Types.ObjectId(req.UserData.sub));

        return chats;
    }
}
