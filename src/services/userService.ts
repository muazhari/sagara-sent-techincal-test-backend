import {Service} from 'typedi';
import {User} from '../models/user';

@Service()
export class UserService {
    async me(id: string) {
        const user = await User.findById(id);
        if (!user) throw new Error('not found');
        return {_id: user._id.toString(), email: user.email};
    }

    async setIsOnline(id: string, isOnline: boolean) {
        const user = await User.findById(id);
        if (!user) throw new Error('not found');
        user.isOnline = isOnline;
        await user.save();
    }
}
