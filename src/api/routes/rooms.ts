import {Router} from 'express';
import {auth} from '../middleware/auth';
import roomService from "../../services/roomService.ts";
import type {AuthenticatedRequest} from "../../infrastructure/server.ts";

const router = Router();

router.post('/', auth(true), async (req, res) => {
    try {
        const {name} = req.body;
        const room = await roomService.create(name);
        res.json(room);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'unknown error';
        res.status(400).json({error: message});
    }
});

router.get('/', async (_req, res) => {
    res.json(await roomService.all());
});

router.get('/:id', async (req, res) => {
    try {
        res.json(await roomService.get(req.params.id));
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'unknown error';
        res.status(404).json({error: message});
    }
});

router.post('/:id/join', auth(true), async (req: AuthenticatedRequest, res) => {
    try {
        const roomId = req.params.id;
        const userId = req.userId;

        if (!roomId) {
            return res.status(400).json({error: 'room ID is required'});
        }
        if (!userId) {
            return res.status(401).json({error: 'user authentication required'});
        }

        await roomService.join(roomId, userId);
        res.json({ok: true});
    } catch (e: unknown) {
        const error = e as Error;
        res.status(400).json({error: error.message});
    }
});

export default router;
