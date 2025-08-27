import {Server} from 'socket.io';

let ioInstance: Server | null = null;

export function setIo(io: Server) {
    ioInstance = io;
}

export function getIo(): Server {
    if (!ioInstance) throw new Error('io not initialized');
    return ioInstance;
}

