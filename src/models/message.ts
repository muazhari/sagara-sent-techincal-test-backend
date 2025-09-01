import {Document, model, Schema, Types} from 'mongoose';
import type {IUser} from './user';
import type {IRoom} from './room';

export interface IMessage extends Document {
    _id: Types.ObjectId;
    user: IUser['_id'];
    room: IRoom['_id'];
    content: string;
    timestamp: Date;
}

export const messageSchema = new Schema<IMessage>({
    user: {type: Schema.Types.ObjectId, ref: 'users', required: true},
    room: {type: Schema.Types.ObjectId, ref: 'rooms', required: true},
    content: {type: String, required: true},
    timestamp: {type: Date, default: Date.now},
});

export const Message = model<IMessage>('messages', messageSchema);
