import {Router} from 'express';
import {auth} from '../middleware/auth';
import {messageService, serverInstance} from "../../infrastructure/container.ts";
import type {AuthenticatedRequest} from "../../infrastructure/server.ts";

const router = Router();

router.get('/:id/messages', async (req, res) => {
    const roomId = req.params.id;
    if (!roomId) {
        return res.status(400).json({error: 'Room ID is required'});
    }
    const list = await messageService.list(roomId);
    res.json(list);
});

router.post('/:id/messages', auth(true), async (req: AuthenticatedRequest, res) => {
    try {
        const roomId = req.params.id;
        const userId = req.userId;

        if (!roomId) {
            return res.status(400).json({error: 'Room ID is required'});
        }
        if (!userId) {
            return res.status(401).json({error: 'User authentication required'});
        }

        const {content} = req.body;
        const message = await messageService.create(roomId, userId, content);
        serverInstance.io.to(roomId).emit('chatMessage', message);
        res.json(message);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'unknown error';
        res.status(400).json({error: message});
    }
});

export default router;
