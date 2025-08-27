import {Service} from 'typedi';
import {Message} from '../models/message';
import {Room} from "../models/room.ts";
import {RoomUser} from "../models/roomUser.ts";

@Service()
export class MessageService {
    async create(roomId: string, userId: string, content: string) {
        const room = await Room.findById(roomId);
        if (!room) throw new Error('room not found');
        const roomUsers = await RoomUser.findOne({room: roomId, user: userId});
        if (!roomUsers) throw new Error('user not in room');
        const message = await Message.create({room: roomId, user: userId, content});
        return {_id: message._id.toString(), room: roomId, user: userId, content, timestamp: message.timestamp};
    }

    async list(roomId: string) {
        const messages = await Message.find({room: roomId}).sort({timestamp: -1});
        return messages.map(message => ({
            _id: message._id.toString(),
            room: roomId,
            user: message.user.toString(),
            content: message.content,
            timestamp: message.timestamp
        }));
    }
}
