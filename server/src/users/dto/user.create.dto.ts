import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

export class CreateUserRequestDto {
    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;
}

export class CreateUserResponseDto {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
}
