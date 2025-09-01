import {Document, model, Schema, Types} from 'mongoose';

export interface IRoom extends Document {
    _id: Types.ObjectId;
    name: string;
}

export const roomSchema = new Schema<IRoom>({
    name: {type: String, required: true, unique: true},
});

export const Room = model<IRoom>('rooms', roomSchema);
