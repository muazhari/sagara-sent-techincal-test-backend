import {Document, model, Schema, Types} from 'mongoose';

export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    password?: string;
    isOnline: boolean;
}

export const userSchema = new Schema<IUser>({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    isOnline: {type: Boolean, required: false, default: false}
});

export const User = model<IUser>('users', userSchema);
