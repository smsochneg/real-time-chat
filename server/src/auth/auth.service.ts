import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthorizeRequestDto, RegisterRequestDto } from './dto/authorize.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JWTPayload } from 'src/common/types';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async validateAuthToken(token: string) {
        return await this.jwtService.verifyAsync<JWTPayload>(token);
    }

    async authorize(request: AuthorizeRequestDto) {
        const user = await this.usersService.getUserByEmail(request.email);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const password = await this.usersService.getUserPasswordById(user._id);

        if (!password) {
            throw new InternalServerErrorException('Error validating password');
        }

        const passwordMatch = await compare(request.password, password);
        if (!passwordMatch) {
            throw new UnauthorizedException('Passwords do not match');
        }

        const payload = { sub: user._id, username: user.username };
        const access_token = await this.jwtService.signAsync(payload);

        return { user, access_token };
    }

    async register(request: RegisterRequestDto) {
        return await this.usersService.createUser(request);
    }
}
