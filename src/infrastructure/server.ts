import 'reflect-metadata';
import express, {type Request} from 'express';
import http from 'http';
import {Server, Socket} from 'socket.io';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import authRouter from '../api/routes/auth';
import roomsRouter from '../api/routes/rooms';
import messagesRouter from '../api/routes/messages';
import usersRouter from '../api/routes/users';
import jwt from "jsonwebtoken";
import {connection} from "../api/sockets/connection.ts";
import {JWT_SECRET} from "./env.ts";

export interface ServerInstance {
    app: express.Express;
    httpServer: http.Server;
    io: Server;
    close: () => Promise<void>;
}

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export interface AuthenticatedSocket extends Socket {
    userId?: string;
}

export async function buildServer(mongoUri: string): Promise<ServerInstance> {
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

    io.on('connection', connection(io));

    return {
        app, httpServer, io, close: async () => {
            await io.close();
            await new Promise((resolve, reject) => httpServer.close(resolve));
            if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
        }
    };
}
