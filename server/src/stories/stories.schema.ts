import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserModel } from 'src/users/users.schema';

export type StoryDocument = Story & Document & { createdAt: string; updatedAt: string };

@Schema({ timestamps: true })
export class Story {
    @Prop({ required: true, type: Types.ObjectId, ref: UserModel.name })
    userId: Types.ObjectId;

    @Prop({ required: true, index: true })
    videoId: Types.ObjectId;

    // Не TTL индекс, потому что можно настраивать время жизни через env.
    // Соответственно ииндекс не будет перестраиваться но новое время из env.
    @Prop({ index: true })
    createdAt: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);

StorySchema.index({ userId: 1, createdAt: -1 });
