import {Router} from 'express';
import {Container} from 'typedi';
import {MessageService} from '../../services/messageService';
import type {AuthenticatedRequest} from '../middleware/auth';
import {auth} from '../middleware/auth';
import {getIo} from '../../infrastructure/io';

const router = Router();
const messageService = () => Container.get(MessageService);

// parent mounted at /api/rooms
router.get('/:id/messages', async (req, res) => {
    const roomId = req.params.id;
    if (!roomId) {
        return res.status(400).json({error: 'Room ID is required'});
    }
    const list = await messageService().list(roomId);
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
        const message = await messageService().create(roomId, userId, content);
        try {
            getIo().to(roomId).emit('chatMessage', message);
        } catch (error) {
            // Log error but don't fail the request
            console.error('Failed to emit socket message:', error);
        }
        res.json(message);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(400).json({error: message});
    }
});

export default router;
