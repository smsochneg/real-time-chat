import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatsModel, ChatsSchema } from './chats.schema';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { ChatsHandlers } from './chats.handlers';

@Module({
    imports: [MongooseModule.forFeature([{ name: ChatsModel.name, schema: ChatsSchema }]), UsersModule, AuthModule],
    providers: [ChatsService, ChatsHandlers],
    controllers: [ChatsController],
    exports: [ChatsService, ChatsHandlers],
})
export class ChatsModule {}
