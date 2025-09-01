import {User} from '../models/user';

const me = async (id: string) => {
    const user = await User.findById(id);
    if (!user) throw new Error('not found');
    return {_id: user._id.toString(), email: user.email};
};

const setIsOnline = async (id: string, isOnline: boolean) => {
    const user = await User.findById(id);
    if (!user) throw new Error('not found');
    user.isOnline = isOnline;
    await user.save();
};

export default {
    me,
    setIsOnline
};