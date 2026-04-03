import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { genSalt, hash } from 'bcrypt';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UserModel {
    @Prop({ required: true, unique: true, index: true })
    username: string;

    @Prop({ required: true, unique: true, index: true, select: false })
    email: string;

    @Prop({ required: true, select: false })
    password: string;

    @Prop()
    createdAt: string;
}

export type UserDocument = UserModel & Document;

export const UserSchema = SchemaFactory.createForClass(UserModel);

UserSchema.pre('save', async function () {
    const salt = await genSalt(10);
    const hashPassword = await hash(this.get('password'), salt);
    this.set('password', hashPassword);
});
