import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MessageModel } from './messages.schema';
import { Model, Types } from 'mongoose';
import { ChatsService } from 'src/chats/chats.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventType } from 'src/common/types/websocket';
import { MessageSavedEvent } from 'src/events/messages.event';
import { BaseDocument } from 'src/common/types/mongoose';
import { UserModel } from 'src/users/users.schema';

@Injectable()
export class MessagesService {
    constructor(
        @InjectModel(MessageModel.name) private readonly messageModel: Model<MessageModel>,
        private readonly chatsService: ChatsService,
        private eventEmitter: EventEmitter2,
    ) {}

    async sendMessageToChat({
        chatId,
        message,
        sender,
    }: {
        chatId: Types.ObjectId;
        sender: Types.ObjectId;
        message: string;
    }) {
        await this.chatsService.isAuthorizedForChat(chatId, sender);

        const messageDocument = (await (
            await new this.messageModel({ chatId, sender, message }).save()
        ).populate('sender')) as BaseDocument<MessageModel & { sender: BaseDocument<UserModel> }>;

        this.eventEmitter.emit(EventType.MESSAGE_SAVED, new MessageSavedEvent(messageDocument));
        return messageDocument;
    }

    async getMessagesForChat({ chatId, userId }: { chatId: Types.ObjectId; userId: Types.ObjectId }) {
        await this.chatsService.isAuthorizedForChat(chatId, userId);

        return await this.messageModel
            .find({ chatId }, { sender: 1, chatId: 1, message: 1, createdAt: 1 })
            .sort({ createdAt: 1 })
            .populate('sender', 'id username')
            .exec();
    }

    async getMessagesStartingFrom({
        chatId,
        messageId,
        userId,
    }: {
        chatId: Types.ObjectId;
        userId: Types.ObjectId;
        messageId: Types.ObjectId;
    }) {
        await this.chatsService.isAuthorizedForChat(chatId, userId);

        const currentMessage = await this.messageModel.findOne(messageId).exec();

        if (!currentMessage) return [];

        const newMessages = await this.messageModel
            .find(
                { chatId, createdAt: { $gt: currentMessage.createdAt } },
                { sender: 1, chatId: 1, message: 1, createdAt: 1 },
            )
            .sort({ createdAt: 1 })
            .populate('sender', 'id username')
            .exec();

        return newMessages;
    }
}
