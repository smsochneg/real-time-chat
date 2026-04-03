import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserModel } from 'src/users/users.schema';

@Schema()
export class ChatsModel {
    @Prop({
        required: true,
        type: [Types.ObjectId],
        ref: UserModel.name,
        index: true,
        validate: [
            (val: Types.ObjectId[]) => {
                return val.length === 2;
            },
            'Should have 2 participants',
        ],
    })
    participants: Types.ObjectId[];

    @Prop({
        index: true,
        unique: true,
    })
    usersHashKey: string;
}

export type ChatsDocument = ChatsModel & Document;

export const ChatsSchema = SchemaFactory.createForClass(ChatsModel);

ChatsSchema.pre('save', function () {
    const sortedParticipants = this.get('participants')
        .map((id) => id.toString())
        .sort()
        .map((id) => new Types.ObjectId(id));
    this.set('participants', sortedParticipants);

    this.set('usersHashKey', sortedParticipants.map(String).join(':'));
});
