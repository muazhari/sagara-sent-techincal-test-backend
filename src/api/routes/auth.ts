import {Router} from 'express';
import {Container} from 'typedi';
import {AuthService} from '../../services/authService';

const router = Router();
const svc = () => Container.get(AuthService);

router.post('/register', async (req, res) => {
    try {
        const {email, password} = req.body;
        const result = await svc().register(email, password);
        res.json(result);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(400).json({error: message});
    }
});

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const result = await svc().login(email, password);
        res.json(result);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(400).json({error: message});
    }
});

export default router;
