import { Types } from 'mongoose';

export type BaseDocument<T> = {
    id: Types.ObjectId;
} & T;
