import {MongoMemoryServer} from 'mongodb-memory-server';
import {randomUUID} from "node:crypto";
import {serverInstance, setServerInstance} from "../src/infrastructure/container.ts";

export async function createServer() {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await setServerInstance(0, mongoUri);
}

export async function closeServer() {
    await serverInstance.io.close();
    serverInstance.httpServer.close();
}

export async function request(path: string, options: any = {}): Promise<any> {
    const url = `${`http://localhost:${serverInstance.port}`}${path}`;
    if (options.body && typeof options.body !== 'string') {
        options.body = JSON.stringify(options.body);
    }
    options.headers = {
        'Content-Type': 'application/json',
        ...(options.headers ?? {})
    };
    const res = await fetch(url, options);
    const body = await res.json();
    return {status: res.status, body};
}

export async function createTestUser(email = `user${randomUUID()}@test.com`, password = 'password123') {
    const response = await request('/api/auth/register', {method: 'POST', body: {email, password}});

    if (response.status !== 200) {
        throw new Error(`Failed to create user: ${response}`);
    }

    return response.body;
}

export async function loginTestUser(email = 'test@example.com', password = 'password123') {
    const response = await request('/api/auth/login', {method: 'POST', body: {email, password}});

    if (response.status !== 200) {
        throw new Error(`Failed to login user: ${response}`);
    }

    return response.body;
}

export async function createTestRoom(name = `room${randomUUID()}`, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await request('/api/rooms', {method: 'POST', body: {name}, headers});

    if (response.status !== 200) {
        throw new Error(`Failed to create room: ${response}`);
    }

    return response.body;
}

export async function joinTestRoom(roomId: string, token: string) {
    const response = await request(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`}
    });

    if (response.status !== 200) {
        throw new Error(`Failed to join room: ${response}`);
    }

    return response.body;
}

export async function createTestMessage(roomId: string, content: string, token: string) {
    const response = await request(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`},
        body: {content}
    });

    if (response.status !== 200) {
        throw new Error(`Failed to create message: ${response}`);
    }

    return response.body;
}