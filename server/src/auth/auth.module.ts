import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { AuthGuard } from './auth.guard';
import { WsAuthGuard } from './ws-auth.guard';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRES_IN'),
                },
            }),
            inject: [ConfigService],
        }),
        UsersModule,
    ],
    providers: [AuthService, AuthGuard, WsAuthGuard],
    controllers: [AuthController],
    exports: [JwtModule, AuthGuard, AuthService, WsAuthGuard],
})
export class AuthModule {}
