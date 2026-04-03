import { BaseDocument } from 'src/common/types/mongoose';
import { MessageModel } from 'src/messages/messages.schema';
import { UserModel } from 'src/users/users.schema';

export class MessageSavedEvent {
    constructor(public readonly message: BaseDocument<MessageModel & { sender: BaseDocument<UserModel> }>) {}
}
