import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChatRequestDto {
    @IsNotEmpty()
    @IsString()
    participantId: string;
}
