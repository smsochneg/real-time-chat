import { Schema } from 'mongoose';

export function toJSONPlugin(schema: Schema) {
    schema.set('toJSON', {
        virtuals: true,
        versionKey: false,
        transform(_, ret) {
            ret.id = ret._id;
            delete ret._id;
        },
    });

    schema.set('toObject', {
        virtuals: true,
        versionKey: false,
        transform(_, ret) {
            ret.id = ret._id;
            delete ret._id;
        },
    });
}
