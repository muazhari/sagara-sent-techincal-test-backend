import {MongoMemoryServer} from 'mongodb-memory-server';
import {buildServer, type BuiltServer} from '../src/infrastructure/server';
import supertest from 'supertest';
import mongoose from 'mongoose';
import {randomUUID} from "node:crypto";

let mongod: MongoMemoryServer;
let server: BuiltServer;
let serverPort: number;

export async function setupTest() {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    server = await buildServer(uri);

    // Start the HTTP server on a dynamic port
    await new Promise<void>((resolve) => {
        const httpServer = server.httpServer.listen(0, () => {
            serverPort = (httpServer.address() as any).port;
            resolve();
        });
    });

    return server;
}

export async function teardownTest() {
    if (server) {
        await server.close();
    }
    if (mongod) {
        await mongod.stop();
    }
}

export async function clearDatabase() {
    if (mongoose.connection.readyState !== 0) {
        await Promise.all(
            Object
                .values(mongoose.connection.collections)
                .map(col => col.deleteMany({}))
        );
    }
}

export function getApp() {
    return server.app;
}

export function getIo() {
    return server.io;
}

export function getServerPort() {
    return serverPort;
}

export async function createTestUser(email?: string, password = 'password123') {
    // Generate unique email if not provided
    const userEmail = email || `user${randomUUID()}@test.com`;

    const response = await supertest(server.app)
        .post('/api/auth/register')
        .send({email: userEmail, password});

    if (response.status !== 200) {
        console.error('Failed to create user:', response.body);
        throw new Error(`Failed to create user: ${response.status}`);
    }

    return response.body;
}

export async function loginTestUser(email = 'test@example.com', password = 'password123') {
    const response = await supertest(server.app)
        .post('/api/auth/login')
        .send({email, password});

    if (response.status !== 200) {
        console.error('Failed to login user:', response.body);
        throw new Error(`Failed to login user: ${response.status}`);
    }

    return response.body;
}

export async function createTestRoom(name?: string, token?: string) {
    // Generate unique room name if not provided
    const roomName = name || `room${randomUUID()}`;

    const request = supertest(server.app).post('/api/rooms').send({name: roomName});
    if (token) {
        request.set('Authorization', `Bearer ${token}`);
    }
    const response = await request;

    if (response.status !== 200 && response.status !== 400) {
        console.error('Failed to create room:', response.body, 'Status:', response.status);
    }

    return response.body;
}

export async function joinTestRoom(roomId: string, token: string) {
    const response = await supertest(server.app)
        .post(`/api/rooms/${roomId}/join`)
        .set('Authorization', `Bearer ${token}`)
        .send();

    if (response.status !== 200) {
        console.error('Failed to join room:', response.body);
        throw new Error(`Failed to join room: ${response.status}`);
    }

    return response.body;
}

export async function createTestMessage(roomId: string, content: string, token: string) {
    const response = await supertest(server.app)
        .post(`/api/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({content});

    if (response.status !== 200) {
        console.error('Failed to create message:', response.body);
        throw new Error(`Failed to create message: ${response.status}`);
    }

    return response.body;
}