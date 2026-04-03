import { ChatsModel } from 'src/chats/chats.schema';
import { BaseDocument } from 'src/common/types/mongoose';
import { UserModel } from 'src/users/users.schema';

export class ChatCreatedEvent {
    constructor(public readonly chat: BaseDocument<ChatsModel & { participants: BaseDocument<UserModel>[] }>) {}
}
