import {Router} from 'express';
import {authService} from "../../infrastructure/container.ts";

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const {email, password} = req.body;
        const result = await authService.register(email, password);
        res.json(result);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'unknown error';
        res.status(400).json({error: message});
    }
});

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'unknown error';
        res.status(400).json({error: message});
    }
});

export default router;
