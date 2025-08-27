import {Router} from 'express';
import {Container} from 'typedi';
import {RoomService} from '../../services/roomService';
import type {AuthenticatedRequest} from '../middleware/auth';
import {auth} from '../middleware/auth';

const router = Router();
const svc = () => Container.get(RoomService);

router.post('/', auth(true), async (req, res) => {
    try {
        const {name} = req.body;
        const room = await svc().create(name);
        res.json(room);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(400).json({error: message});
    }
});

router.get('/', async (_req, res) => {
    res.json(await svc().all());
});

router.get('/:id', async (req, res) => {
    try {
        res.json(await svc().get(req.params.id));
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(404).json({error: message});
    }
});

router.post('/:id/join', auth(true), async (req: AuthenticatedRequest, res) => {
    try {
        const roomId = req.params.id;
        const userId = req.userId;

        if (!roomId) {
            return res.status(400).json({error: 'Room ID is required'});
        }
        if (!userId) {
            return res.status(401).json({error: 'User authentication required'});
        }

        await svc().join(roomId, userId);
        res.json({ok: true});
    } catch (e: unknown) {
        const error = e as Error;
        res.status(400).json({error: error.message});
    }
});

export default router;
