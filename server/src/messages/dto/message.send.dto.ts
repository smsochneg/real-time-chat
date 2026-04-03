import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageRequestDto {
    @IsNotEmpty()
    @IsString()
    message: string;
    @IsNotEmpty()
    @IsString()
    chatId: string;
}
