import {Service} from 'typedi';
import {User} from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {JWT_SECRET} from '../config/env';

@Service()
export class AuthService {
    async register(email: string, password: string) {
        const exists = await User.findOne({email});
        if (exists) throw new Error('email taken');
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({email, password: hashed});
        const token = jwt.sign({id: user._id.toString()}, JWT_SECRET, {expiresIn: '1h'});
        return {user: {_id: user._id.toString(), email: user.email}, token};
    }

    async login(email: string, password: string) {
        const user = await User.findOne({email});
        if (!user) throw new Error('invalid credentials');
        const ok = await bcrypt.compare(password, user.password!);
        if (!ok) throw new Error('invalid credentials');
        const token = jwt.sign({id: user._id.toString()}, JWT_SECRET, {expiresIn: '1h'});
        return {user: {_id: user._id.toString(), email: user.email}, token};
    }
}

