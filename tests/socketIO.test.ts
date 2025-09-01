import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, test} from 'vitest';
import {io as ioClient, Socket} from 'socket.io-client';
import {closeServer, createServer, createTestMessage, createTestRoom, createTestUser, joinTestRoom} from './testUtils';
import {serverInstance} from "../src/infrastructure/container.ts";

describe('Socket.IO Integration Tests', () => {
    let user1: any;
    let user2: any;
    let room1: any;

    let client1: Socket;
    let client2: Socket;
    let client3: Socket;

    beforeAll(async () => {
        await createServer();
    });

    beforeEach(async () => {
        user1 = await createTestUser();
        user2 = await createTestUser();
        room1 = await createTestRoom(undefined, user1.token);
        await joinTestRoom(room1._id, user1.token);
        await createTestMessage(room1._id, 'Initial message', user1.token);

        client1 = ioClient(`http://localhost:${serverInstance.port}`, {
            query: {token: user1.token}
        });
        client2 = ioClient(`http://localhost:${serverInstance.port}`, {
            query: {token: user2.token}
        });
        client3 = ioClient(`http://localhost:${serverInstance.port}`);

        await new Promise<void>((resolve) => {
            let connected = 0;
            const checkConnected = () => {
                connected++;
                if (connected === 3) resolve();
            };
            client1.on('connect', checkConnected);
            client2.on('connect', checkConnected);
            client3.on('connect', checkConnected);
        });
    });

    afterEach(async () => {
        client1.disconnect();
        client2.disconnect();
        client3.disconnect();
    });

    afterAll(async () => {
        await closeServer();
    });

    test('should join and leave rooms', () => new Promise<void>(async (resolve) => {
        const newRoom = await createTestRoom(undefined, user1.token) as { _id: string };
        client1.emit('joinRoom', newRoom._id, (response: any) => {
            expect(response.ok).toBe(true);

            client1.emit('leaveRoom', newRoom._id, (response: any) => {
                expect(response.ok).toBe(true);
                resolve();
            });
        });
    }));

    test('should send and receive chat messages', () => new Promise<void>((resolve) => {
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
                    resolve();
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
    }));

    test('should handle typing indicators', () => new Promise<void>((resolve) => {
        // First, join the room
        client1.emit('joinRoom', room1._id, () => {
            client2.emit('joinRoom', room1._id, () => {
                // Set up typing listener on client2
                client2.on('typing', (data: any) => {
                    expect(data.userId).toBe(user1.user._id);
                    expect(data.roomId).toBe(room1._id);
                    resolve();
                });

                // Send typing indicator from client1
                client1.emit('typing', {roomId: room1._id}, (response: any) => {
                    expect(response.ok).toBe(true);
                });
            });
        });
    }));

    test('should track user online/offline presence', () => new Promise<void>((resolve) => {
        // Listen for userOnline event on client2
        client2.on('userOnline', (data: any) => {
            expect(data.userId).toBe(user1.user._id);
            resolve();
        });

        // Disconnect and reconnect client1 to trigger userOnline
        client1.disconnect();
        client1 = ioClient(`http://localhost:${serverInstance.port}`, {
            query: {token: user1.token}
        });
    }));

    test('should handle unauthenticated chat message', () => new Promise<void>((resolve) => {
        client3.emit(
            'chatMessage',
            {
                roomId: room1._id,
                content: 'This should fail'
            },
            (response: any) => {
                expect(response.ok).toBe(false);
                expect(response.error).toBe('unauthenticated');
                resolve();
            }
        );
    }));
});
