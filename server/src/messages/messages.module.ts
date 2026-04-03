import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageModel, MessageSchema } from './messages.schema';
import { ChatsModule } from 'src/chats/chats.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: MessageModel.name, schema: MessageSchema }]), AuthModule, ChatsModule],
    controllers: [MessagesController],
    providers: [MessagesService],
})
export class MessagesModule {}
