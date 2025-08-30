import {MongoMemoryServer} from 'mongodb-memory-server';
import {buildServer, type ServerInstance} from '../src/infrastructure/server';
import supertest from 'supertest';
import mongoose from 'mongoose';
import {randomUUID} from "node:crypto";
import {serverInstance, setServerInstance} from "../src/infrastructure/container.ts";

export let serverPort: number;

export async function setupTest() {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    const serverInstance: ServerInstance = await buildServer(uri);
    setServerInstance(serverInstance)

    // Start the HTTP server on a dynamic port
    await new Promise<void>((resolve) => {
        const httpServer = serverInstance.httpServer.listen(0, () => {
            serverPort = (httpServer.address() as any).port;
            resolve();
        });
    });

    return serverInstance;
}

export async function teardownTest() {
    if (serverInstance) {
        await serverInstance.close();
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

export async function createTestUser(email = `user${randomUUID()}@test.com`, password = 'password123') {
    const response = await supertest(serverInstance.app)
        .post('/api/auth/register')
        .send({email: email, password});

    if (response.status !== 200) {
        console.error('Failed to create user:', response.body);
        throw new Error(`Failed to create user: ${response.status}`);
    }

    return response.body;
}

export async function loginTestUser(email = 'test@example.com', password = 'password123') {
    const response = await supertest(serverInstance.app)
        .post('/api/auth/login')
        .send({email, password});

    if (response.status !== 200) {
        console.error('Failed to login user:', response.body);
        throw new Error(`Failed to login user: ${response.status}`);
    }

    return response.body;
}

export async function createTestRoom(name = `room${randomUUID()}`, token?: string) {
    const request = supertest(serverInstance.app).post('/api/rooms').send({name: name});
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
    const response = await supertest(serverInstance.app)
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
    const response = await supertest(serverInstance.app)
        .post(`/api/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({content});

    if (response.status !== 200) {
        console.error('Failed to create message:', response.body);
        throw new Error(`Failed to create message: ${response.status}`);
    }

    return response.body;
}