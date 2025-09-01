import messageService from "../../services/messageService.ts";
import roomService from "../../services/roomService.ts";
import userService from "../../services/userService.ts";
import type {AuthenticatedSocket} from "../../infrastructure/server.ts";
import {Server} from 'socket.io';

export const connection = (io: Server) => async (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (userId) {
        await userService.setIsOnline(userId, true)
        const rooms = await roomService.getAllByUserId(userId);
        await Promise.all(rooms.map(room => socket.join(room._id.toString())));
        socket.broadcast.emit('userOnline', {userId});
    }
    socket.on('joinRoom', (roomId: string, callback: Function) => {
        if (socket.rooms.has(roomId)) {
            callback({ok: false, error: 'already in room'});
        } else {
            socket.join(roomId);
            callback({ok: true});
        }
    });
    socket.on('leaveRoom', (roomId: string, callback: Function) => {
        if (socket.rooms.has(roomId)) {
            socket.leave(roomId);
            callback({ok: true});
        } else {
            callback({ok: false, error: 'not in room'});
        }
    });
    socket.on('chatMessage', async (data: { roomId: string; content: string }, callback: Function) => {
        try {
            if (!userId) throw new Error('unauthenticated');
            const message = await messageService.create(data.roomId, userId, data.content);
            io.to(data.roomId).emit('chatMessage', message);
            callback({ok: true, message: message});
        } catch (e: unknown) {
            const error = e as Error || new Error('unknown error');
            callback({ok: false, error: error.message});
        }
    });
    socket.on('typing', (data: { roomId: string }, callback: Function) => {
        if (userId) io.to(data.roomId).emit('typing', {userId, roomId: data.roomId});
        callback({ok: true});
    });
    socket.on('disconnect', async () => {
        if (userId) {
            await userService.setIsOnline(userId, false)
            socket.broadcast.emit('userOffline', {userId})
        }
    });
}
