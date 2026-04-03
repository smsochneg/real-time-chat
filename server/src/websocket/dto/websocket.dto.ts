import { IsNotEmpty, IsString } from 'class-validator';

export class JoinChatSocketEventDto {
    @IsNotEmpty()
    @IsString()
    chatId: string;
}
export class LeaveChatSocketEventDto {
    @IsNotEmpty()
    @IsString()
    chatId: string;
}
export class SendMessageSocketEventDto {
    @IsNotEmpty()
    @IsString()
    message: string;
    @IsNotEmpty()
    @IsString()
    chatId: string;
}
