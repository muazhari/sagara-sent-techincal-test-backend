import {Document, model, Schema, Types} from 'mongoose';
import type {IRoom} from "./room.ts";
import type {IUser} from "./user.ts";

export interface IRoomUser extends Document {
    _id: Types.ObjectId;
    room: IRoom['_id']
    user: IUser['_id'];
    joinedAt: Date;
}

export const roomUserSchema = new Schema<IRoomUser>({
    room: {type: Schema.Types.ObjectId, ref: 'rooms', required: true},
    user: {type: Schema.Types.ObjectId, ref: 'users', required: true},
    joinedAt: {type: Date, default: Date.now}
});
roomUserSchema.index({room: 1, user: 1}, {unique: true});

export const RoomUser = model<IRoomUser>('roomUsers', roomUserSchema);
