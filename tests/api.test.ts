import {afterEach, beforeAll, beforeEach, describe, expect, test} from 'bun:test';
import supertest from 'supertest';
import {io as ioClient, Socket} from 'socket.io-client';
import {
    createTestMessage,
    createTestRoom,
    createTestUser,
    getApp,
    getServerPort,
    joinTestRoom,
    setupTest
} from './testUtils';

describe('Chat API Integration Tests', () => {
    let app: any;
    let user1: any;
    let user2: any;
    let room1: any;

    beforeAll(async () => {
        await setupTest();
        app = getApp();
    });

    beforeEach(async () => {
        // Create test users and room for each test with unique identifiers
        user1 = await createTestUser();
        user2 = await createTestUser();
        room1 = await createTestRoom(undefined, user1.token);
        await joinTestRoom(room1._id, user1.token);
        await createTestMessage(room1._id, 'Initial message', user1.token);
    });

    describe('Auth REST', () => {
        test('POST /api/auth/register - should register a new user', async () => {
            const response = await supertest(app)
                .post('/api/auth/register')
                .send({email: 'newuser@test.com', password: 'password123'});

            expect(response.status).toBe(200);
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe('newuser@test.com');
            expect(response.body.token).toBeDefined();
            expect(response.body.user.password).toBeUndefined();
        });

        test('POST /api/auth/register - should fail with duplicate email', async () => {
            const response = await supertest(app)
                .post('/api/auth/register')
                .send({email: user1.user.email, password: 'password123'});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('email taken');
        });

        test('POST /api/auth/login - should login existing user', async () => {
            const response = await supertest(app)
                .post('/api/auth/login')
                .send({email: user1.user.email, password: 'password123'});

            expect(response.status).toBe(200);
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(user1.user.email);
            expect(response.body.token).toBeDefined();
        });

        test('POST /api/auth/login - should fail with invalid credentials', async () => {
            const response = await supertest(app)
                .post('/api/auth/login')
                .send({email: user1.user.email, password: 'wrongpassword'});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('invalid credentials');
        });
    });

    describe('Rooms REST', () => {
        test('POST /api/rooms - should create a chat room', async () => {
            const response = await supertest(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${user1.token}`)
                .send({name: 'new-room'});

            expect(response.status).toBe(200);
            expect(response.body._id).toBeDefined();
            expect(response.body.name).toBe('new-room');
        });

        test('POST /api/rooms - should fail without authentication', async () => {
            const response = await supertest(app)
                .post('/api/rooms')
                .send({name: 'new-room'});

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('missing token');
        });

        test('POST /api/rooms - should fail with duplicate room name', async () => {
            const response = await supertest(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${user1.token}`)
                .send({name: room1.name});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('room exists');
        });

        test('GET /api/rooms - should get all chat rooms', async () => {
            const response = await supertest(app).get('/api/rooms');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body.some((r: any) => r.name === room1.name)).toBe(true);
        });

        test('GET /api/rooms/:id - should get a specific room detail', async () => {
            const response = await supertest(app).get(`/api/rooms/${room1._id}`);

            expect(response.status).toBe(200);
            expect(response.body._id).toBe(room1._id);
            expect(response.body.name).toBe(room1.name);
        });

        test('GET /api/rooms/:id - should return 404 for non-existent room', async () => {
            const response = await supertest(app).get('/api/rooms/507f1f77bcf86cd799439011');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('not found');
        });

        test('POST /api/rooms/:id/join - should join a room', async () => {
            const response = await supertest(app)
                .post(`/api/rooms/${room1._id}/join`)
                .set('Authorization', `Bearer ${user2.token}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
        });

        test('POST /api/rooms/:id/join - should fail without authentication', async () => {
            const response = await supertest(app)
                .post(`/api/rooms/${room1._id}/join`);

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('missing token');
        });
    });

    describe('Messages REST', () => {
        test('GET /api/rooms/:id/messages - should get messages in a room', async () => {
            const response = await supertest(app).get(`/api/rooms/${room1._id}/messages`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].content).toBe('Initial message');
        });

        test('GET /api/rooms/:id/messages - should return messages in descending order', async () => {
            // Send multiple messages
            await supertest(app)
                .post(`/api/rooms/${room1._id}/messages`)
                .set('Authorization', `Bearer ${user1.token}`)
                .send({content: 'First message'});

            await supertest(app)
                .post(`/api/rooms/${room1._id}/messages`)
                .set('Authorization', `Bearer ${user1.token}`)
                .send({content: 'Second message'});

            const response = await supertest(app).get(`/api/rooms/${room1._id}/messages`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(3);
            expect(response.body[0].content).toBe('Second message'); // Most recent first
            expect(response.body[1].content).toBe('First message');
            expect(response.body[2].content).toBe('Initial message');
        });

        test('POST /api/rooms/:id/messages - should send a new message', async () => {
            const response = await supertest(app)
                .post(`/api/rooms/${room1._id}/messages`)
                .set('Authorization', `Bearer ${user1.token}`)
                .send({content: 'Hello, world!'});

            expect(response.status).toBe(200);
            expect(response.body._id).toBeDefined();
            expect(response.body.content).toBe('Hello, world!');
            expect(response.body.user).toBe(user1.user._id);
            expect(response.body.room).toBe(room1._id);
            expect(response.body.timestamp).toBeDefined();
        });

        test('POST /api/rooms/:id/messages - should fail without authentication', async () => {
            const response = await supertest(app)
                .post(`/api/rooms/${room1._id}/messages`)
                .send({content: 'Hello, world!'});

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('missing token');
        });

        test('POST /api/rooms/:id/messages - should fail when user not in room', async () => {
            const newRoom = await createTestRoom(undefined, user1.token);
            const response = await supertest(app)
                .post(`/api/rooms/${newRoom._id}/messages`)
                .set('Authorization', `Bearer ${user2.token}`)
                .send({content: 'Hello, world!'});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('user not in room');
        });

        test('POST /api/rooms/:id/messages - should fail when room does not exist', async () => {
            const response = await supertest(app)
                .post('/api/rooms/507f1f77bcf86cd799439011/messages')
                .set('Authorization', `Bearer ${user1.token}`)
                .send({content: 'Hello, world!'});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('room not found');
        });
    });

    describe('Users REST', () => {
        test('GET /api/users/me - should get current user profile', async () => {
            const response = await supertest(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${user1.token}`);

            expect(response.status).toBe(200);
            expect(response.body._id).toBe(user1.user._id);
            expect(response.body.email).toBe(user1.user.email);
            expect(response.body.password).toBeUndefined();
        });

        test('GET /api/users/me - should fail without authentication', async () => {
            const response = await supertest(app).get('/api/users/me');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('missing token');
        });

        test('GET /api/users/me - should fail with invalid token', async () => {
            const response = await supertest(app)
                .get('/api/users/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('invalid token');
        });
    });

    describe('Socket.IO Events', () => {
        let client1: Socket;
        let client2: Socket;

        beforeEach(async () => {
            const port = getServerPort();

            // Create socket clients with authentication
            client1 = ioClient(`http://localhost:${port}`, {
                query: {token: user1.token}
            });

            client2 = ioClient(`http://localhost:${port}`, {
                query: {token: user2.token}
            });

            // Wait for connections
            await new Promise<void>((resolve) => {
                let connected = 0;
                const checkConnected = () => {
                    connected++;
                    if (connected === 2) resolve();
                };
                client1.on('connect', checkConnected);
                client2.on('connect', checkConnected);
            });
        });

        afterEach(() => {
            if (client1) client1.disconnect();
            if (client2) client2.disconnect();
        });

        test('should join and leave rooms', (done) => {
            client1.emit('joinRoom', room1._id, (response: any) => {
                expect(response.ok).toBe(true);

                client1.emit('leaveRoom', room1._id, (response: any) => {
                    expect(response.ok).toBe(true);
                    done();
                });
            });
        });

        test('should send and receive chat messages', (done) => {
            // First, join the room
            client1.emit('joinRoom', room1._id, () => {
                client2.emit('joinRoom', room1._id, () => {
                    // Set up message listener on client2
                    client2.on('chatMessage', (message: any) => {
                        expect(message._id).toBeDefined();
                        expect(message.content).toBe('Hello from Socket.IO!');
                        expect(message.user).toBe(user1.user._id);
                        expect(message.room).toBe(room1._id);
                        expect(message.timestamp).toBeDefined();
                        done();
                    });

                    // Send message from client1
                    const payload = {
                        roomId: room1._id,
                        content: 'Hello from Socket.IO!'
                    }
                    client1.emit(
                        'chatMessage',
                        payload,
                        (response: any) => {
                            expect(response.ok).toBe(true);
                            expect(response.message).toBeDefined();
                            expect(response.message.content).toBe(payload.content);
                        }
                    );
                });
            });
        });

        test('should handle typing indicators', (done) => {
            // First, join the room
            client1.emit('joinRoom', room1._id, () => {
                client2.emit('joinRoom', room1._id, () => {
                    // Set up typing listener on client2
                    client2.on('typing', (data: any) => {
                        expect(data.userId).toBe(user1.user._id);
                        expect(data.roomId).toBe(room1._id);
                        done();
                    });

                    // Send typing indicator from client1
                    client1.emit('typing', {roomId: room1._id}, (response: any) => {
                        expect(response.ok).toBe(true);
                    });
                });
            });
        });

        test('should track user online/offline presence', (done) => {
            const port = getServerPort();

            // Listen for userOnline event on client2
            client2.on('userOnline', (data: any) => {
                expect(data.userId).toBe(user1.user._id);
                done();
            });

            // Disconnect and reconnect client1 to trigger userOnline
            client1.disconnect();
            client1 = ioClient(`http://localhost:${port}`, {
                query: {token: user1.token}
            });
        });

        test('should handle unauthenticated chat message', (done) => {
            const port = getServerPort();

            // Create unauthenticated client
            const unauthedClient = ioClient(`http://localhost:${port}`);

            unauthedClient.on('connect', () => {
                unauthedClient.emit(
                    'chatMessage',
                    {
                        roomId: room1._id,
                        content: 'This should fail'
                    },
                    (response: any) => {
                        expect(response.ok).toBe(false);
                        expect(response.error).toBe('unauthenticated');
                        unauthedClient.disconnect();
                        done();
                    }
                );
            });
        });
    });
});
