import {Document, model, Schema, Types} from 'mongoose';

export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    password?: string;
}

const userSchema = new Schema<IUser>({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
});

export const User = model<IUser>('users', userSchema);
