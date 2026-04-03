import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ChatsModel } from './chats.schema';
import { Model, Types } from 'mongoose';
import { MongoError } from 'mongodb';
import { UsersService } from 'src/users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatCreatedEvent } from 'src/events/chats.event';
import { EventType } from 'src/common/types/websocket';
import { UserModel } from 'src/users/users.schema';
import { BaseDocument } from 'src/common/types/mongoose';

@Injectable()
export class ChatsService {
    constructor(
        @InjectModel(ChatsModel.name) private readonly chatsModel: Model<ChatsModel>,
        private readonly usersService: UsersService,
        private eventEmitter: EventEmitter2,
    ) {}

    async getChatsForUser(user: Types.ObjectId) {
        const chats = await this.chatsModel
            .find<ChatsModel>({ participants: user })
            .populate('participants', { id: 1, username: 1 })
            .exec();

        return chats;
    }

    async createChat(participants: Types.ObjectId[]) {
        const users = await this.usersService.getUsersById(participants);

        try {
            const chat = (await (
                await new this.chatsModel({ participants: users.map((user) => user._id) }).save()
            ).populate('participants', { id: 1, username: 1 })) as unknown as BaseDocument<
                ChatsModel & { participants: BaseDocument<UserModel>[] }
            >;

            this.eventEmitter.emit(EventType.CHAT_CREATED, new ChatCreatedEvent(chat));

            return chat;
        } catch (e) {
            if (e instanceof MongoError) {
                if (e.code === 11000) {
                    throw new ConflictException('Chat already exists');
                }
            }

            throw e;
        }
    }

    async isAuthorizedForChat(chatId: Types.ObjectId, userId: Types.ObjectId) {
        const chat = await this.chatsModel.findOne({ _id: chatId }).exec();

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        if (!chat.participants.some((p) => p.toString() === userId.toString())) {
            throw new ForbiddenException('User is not authorized');
        }

        return true;
    }
}
