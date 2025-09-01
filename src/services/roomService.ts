import {Room} from '../models/room';
import {RoomUser} from '../models/roomUser';

const create = async (name: string) => {
    const existing = await Room.findOne({name});
    if (existing) throw new Error('room exists');
    const room = await Room.create({name});
    return {_id: room._id.toString(), name: room.name};
};

const all = async () => {
    const rooms = await Room.find();
    return rooms.map(r => ({_id: r._id.toString(), name: r.name}));
};

const getAllByUserId = async (userId: string) => {
    const roomUsers = await RoomUser.find({user: userId}).populate('room');
    return roomUsers.map(ru => {
        const room = ru.room as any;
        return {_id: room._id.toString(), name: room.name};
    });
};

const get = async (id: string) => {
    const room = await Room.findById(id);
    if (!room) throw new Error('not found');
    return {_id: room._id.toString(), name: room.name};
};

const join = async (roomId: string, userId: string) => {
    await RoomUser.updateOne(
        {room: roomId, user: userId},
        {
            $setOnInsert: {
                room: roomId,
                user: userId
            }
        },
        {upsert: true}
    );
    return {ok: true};
};

export default {
    create,
    all,
    get,
    join,
    getAllByUserId
};