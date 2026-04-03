import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ChatsModel } from 'src/chats/chats.schema';
import { UserModel } from 'src/users/users.schema';

@Schema({ timestamps: true })
export class MessageModel {
    @Prop({ required: true, index: true, ref: ChatsModel.name })
    chatId: Types.ObjectId;

    @Prop({ required: true, ref: UserModel.name })
    sender: Types.ObjectId;

    @Prop({ required: true })
    message: string;

    @Prop()
    createdAt: string;
}

export type MessageDocument = MessageModel & Document;

export const MessageSchema = SchemaFactory.createForClass(MessageModel);

MessageSchema.index({ chatId: 1, createdAt: 1 });
