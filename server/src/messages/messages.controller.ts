import { Body, Controller, Get, Param, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { MessagesService } from './messages.service';
import { Types } from 'mongoose';
import type { Request } from 'express';
import { SendMessageRequestDto } from './dto/message.send.dto';

@UseGuards(AuthGuard)
@Controller('messages')
export class MessagesController {
    constructor(private readonly messageService: MessagesService) {}
    @UsePipes(new ValidationPipe())
    @Post()
    async sendMessage(@Body() body: SendMessageRequestDto, @Req() req: Request) {
        const data = {
            chatId: new Types.ObjectId(body.chatId),
            sender: new Types.ObjectId(req.UserData.sub),
            message: body.message,
        };

        return await this.messageService.sendMessageToChat(data);
    }

    @Get(':chatId')
    async getMessages(@Param('chatId') chatId: string, @Req() req: Request) {
        const data = {
            chatId: new Types.ObjectId(chatId),
            userId: new Types.ObjectId(req.UserData.sub),
        };

        return await this.messageService.getMessagesForChat(data);
    }

    @Get(':chatId/from/:messageId')
    async getMessagesFrom(@Param('chatId') chatId: string, @Param('messageId') messageId: string, @Req() req: Request) {
        const data = {
            chatId: new Types.ObjectId(chatId),
            userId: new Types.ObjectId(req.UserData.sub),
            messageId: new Types.ObjectId(messageId),
        };

        return await this.messageService.getMessagesStartingFrom(data);
    }
}
