import {afterAll, beforeAll, beforeEach, describe, expect, test} from 'vitest';
import {
    closeServer,
    createServer,
    createTestMessage,
    createTestRoom,
    createTestUser,
    joinTestRoom,
    request
} from './testUtils';

describe('REST Integration Tests', () => {
    let user1: any;
    let user2: any;
    let room1: any;

    beforeAll(async () => {
        await createServer();
    });

    beforeEach(async () => {
        user1 = await createTestUser();
        user2 = await createTestUser();
        room1 = await createTestRoom(undefined, user1.token);
        await joinTestRoom(room1._id, user1.token);
        await createTestMessage(room1._id, 'Initial message', user1.token);
    });

    afterAll(async () => {
        await closeServer();
    });

    describe('Auth REST', () => {
        test('POST /api/auth/register - should register a new user', async () => {
            const response = await request('/api/auth/register', {
                method: 'POST',
                body: {email: 'newuser@test.com', password: 'password123'}
            });

            expect(response.status).toBe(200);
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe('newuser@test.com');
            expect(response.body.token).toBeDefined();
            expect(response.body.user.password).toBeUndefined();
        });

        test('POST /api/auth/register - should fail with duplicate email', async () => {
            const response = await request('/api/auth/register', {
                method: 'POST',
                body: {email: user1.user.email, password: 'password123'}
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('email taken');
        });

        test('POST /api/auth/login - should login existing user', async () => {
            const response = await request('/api/auth/login', {
                method: 'POST',
                body: {email: user1.user.email, password: 'password123'}
            });

            expect(response.status).toBe(200);
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(user1.user.email);
            expect(response.body.token).toBeDefined();
        });

        test('POST /api/auth/login - should fail with invalid credentials', async () => {
            const response = await request('/api/auth/login', {
                method: 'POST',
                body: {email: user1.user.email, password: 'wrongpassword'}
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('invalid credentials');
        });
    });

    describe('Rooms REST', () => {
        test('POST /api/rooms - should create a chat room', async () => {
            const response = await request('/api/rooms', {
                method: 'POST',
                headers: {Authorization: `Bearer ${user1.token}`},
                body: {name: 'new-room'}
            });

            expect(response.status).toBe(200);
            expect(response.body._id).toBeDefined();
            expect(response.body.name).toBe('new-room');
        });

        test('POST /api/rooms - should fail without authentication', async () => {
            const response = await request('/api/rooms', {method: 'POST', body: {name: 'new-room'}});

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('missing token');
        });

        test('POST /api/rooms - should fail with duplicate room name', async () => {
            const response = await request('/api/rooms', {
                method: 'POST',
                headers: {Authorization: `Bearer ${user1.token}`},
                body: {name: room1.name}
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('room exists');
        });

        test('GET /api/rooms - should get all chat rooms', async () => {
            const response = await request('/api/rooms');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body.some((r: any) => r.name === room1.name)).toBe(true);
        });

        test('GET /api/rooms/:id - should get a specific room detail', async () => {
            const response = await request(`/api/rooms/${room1._id}`);

            expect(response.status).toBe(200);
            expect(response.body._id).toBe(room1._id);
            expect(response.body.name).toBe(room1.name);
        });

        test('GET /api/rooms/:id - should return 404 for non-existent room', async () => {
            const response = await request('/api/rooms/507f1f77bcf86cd799439011');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('not found');
        });

        test('POST /api/rooms/:id/join - should join a room', async () => {
            const response = await request(`/api/rooms/${room1._id}/join`, {
                method: 'POST',
                headers: {Authorization: `Bearer ${user2.token}`}
            });

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
        });

        test('POST /api/rooms/:id/join - should fail without authentication', async () => {
            const response = await request(`/api/rooms/${room1._id}/join`, {method: 'POST'});

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('missing token');
        });
    });

    describe('Messages REST', () => {
        test('GET /api/rooms/:id/messages - should get messages in a room', async () => {
            const response = await request(`/api/rooms/${room1._id}/messages`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].content).toBe('Initial message');
        });

        test('GET /api/rooms/:id/messages - should return messages in descending order', async () => {
            // Send multiple messages
            await request(`/api/rooms/${room1._id}/messages`, {
                method: 'POST',
                headers: {Authorization: `Bearer ${user1.token}`},
                body: {content: 'First message'}
            });

            await request(`/api/rooms/${room1._id}/messages`, {
                method: 'POST',
                headers: {Authorization: `Bearer ${user1.token}`},
                body: {content: 'Second message'}
            });

            const response = await request(`/api/rooms/${room1._id}/messages`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(3);
            expect(response.body[0].content).toBe('Second message'); // Most recent first
            expect(response.body[1].content).toBe('First message');
            expect(response.body[2].content).toBe('Initial message');
        });

        test('POST /api/rooms/:id/messages - should send a new message', async () => {
            const response = await request(`/api/rooms/${room1._id}/messages`, {
                method: 'POST',
                headers: {Authorization: `Bearer ${user1.token}`},
                body: {content: 'Hello, world!'}
            });

            expect(response.status).toBe(200);
            expect(response.body._id).toBeDefined();
            expect(response.body.content).toBe('Hello, world!');
            expect(response.body.user).toBe(user1.user._id);
            expect(response.body.room).toBe(room1._id);
            expect(response.body.timestamp).toBeDefined();
        });

        test('POST /api/rooms/:id/messages - should fail without authentication', async () => {
            const response = await request(`/api/rooms/${room1._id}/messages`, {
                method: 'POST',
                body: {content: 'Hello, world!'}
            });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('missing token');
        });

        test('POST /api/rooms/:id/messages - should fail when user not in room', async () => {
            const newRoom = await createTestRoom(undefined, user1.token);
            const response = await request(`/api/rooms/${newRoom._id}/messages`, {
                method: 'POST',
                headers: {Authorization: `Bearer ${user2.token}`},
                body: {content: 'Hello, world!'}
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('user not in room');
        });

        test('POST /api/rooms/:id/messages - should fail when room does not exist', async () => {
            const response = await request('/api/rooms/507f1f77bcf86cd799439011/messages', {
                method: 'POST',
                headers: {Authorization: `Bearer ${user1.token}`},
                body: {content: 'Hello, world!'}
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('room not found');
        });
    });

    describe('Users REST', () => {
        test('GET /api/users/me - should get current user profile', async () => {
            const response = await request('/api/users/me', {headers: {Authorization: `Bearer ${user1.token}`}});

            expect(response.status).toBe(200);
            expect(response.body._id).toBe(user1.user._id);
            expect(response.body.email).toBe(user1.user.email);
            expect(response.body.password).toBeUndefined();
        });

        test('GET /api/users/me - should fail without authentication', async () => {
            const response = await request('/api/users/me');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('missing token');
        });

        test('GET /api/users/me - should fail with invalid token', async () => {
            const response = await request('/api/users/me', {headers: {Authorization: 'Bearer invalid-token'}});

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('invalid token');
        });
    });
});
