import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthorizeRequestDto {
    @IsNotEmpty()
    @IsString()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}

export class UpdateRequestDto {
    @IsNotEmpty()
    @IsString()
    request_token: string;
}

export class RegisterRequestDto {
    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}
