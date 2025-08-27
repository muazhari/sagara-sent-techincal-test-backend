import 'reflect-metadata';
import express from 'express';
import http from 'http';
import {Server, Socket} from 'socket.io';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import {JWT_SECRET} from '../config/env';
import jwt from 'jsonwebtoken';
import authRouter from '../api/routes/auth';
import roomsRouter from '../api/routes/rooms';
import messagesRouter from '../api/routes/messages';
import usersRouter from '../api/routes/users';
import {setIo} from './io';
import {Message} from "../models/message.ts";

export interface BuiltServer {
    app: express.Express;
    httpServer: http.Server;
    io: Server;
    close: () => Promise<void>;
}

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

const presence = new Set<string>();

export async function buildServer(mongoUri: string): Promise<BuiltServer> {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri);
    }
    const app = express();
    app.use(bodyParser.json());

    app.use('/api/auth', authRouter);
    app.use('/api/rooms', roomsRouter);
    app.use('/api/rooms', messagesRouter);
    app.use('/api/users', usersRouter);

    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {cors: {origin: '*'}});
    setIo(io);

    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.query?.token as string | undefined;
        if (token) {
            try {
                const payload = jwt.verify(token, JWT_SECRET) as { id: string };
                socket.userId = payload.id;
            } catch {
            }
        }
        next();
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        const userId = socket.userId;
        if (userId) {
            presence.add(userId);
            socket.broadcast.emit('userOnline', {userId});
        }
        socket.on('joinRoom', (roomId: string, ack?: Function) => {
            socket.join(roomId);
            ack && ack({ok: true});
        });
        socket.on('leaveRoom', (roomId: string, ack?: Function) => {
            socket.leave(roomId);
            ack && ack({ok: true});
        });
        socket.on('chatMessage', async (data: { roomId: string; content: string }, ack?: Function) => {
            try {
                if (!userId) throw new Error('unauthenticated');
                const message = await Message.create(
                    {user: userId, room: data.roomId, content: data.content}
                );
                const payload = {
                    _id: message._id.toString(),
                    user: userId,
                    room: data.roomId,
                    content: data.content,
                    timestamp: message.timestamp
                };
                io.to(data.roomId).emit('chatMessage', payload);
                ack && ack({ok: true, message: payload});
            } catch (e: unknown) {
                const error = e as Error || new Error('unknown error');
                ack && ack({ok: false, error: error.message});
            }
        });
        socket.on('typing', (data: { roomId: string }, ack?: Function) => {
            if (userId) io.to(data.roomId).emit('typing', {userId, roomId: data.roomId});
            ack && ack({ok: true});
        });
        socket.on('disconnect', () => {
            if (userId && presence.delete(userId)) socket.broadcast.emit('userOffline', {userId});
        });
    });

    return {
        app, httpServer, io, close: async () => {
            await io.close();
            await new Promise(r => httpServer.close(r));
            if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
        }
    };
}
