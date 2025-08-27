import {Router} from 'express';
import type {AuthenticatedRequest} from '../middleware/auth';
import {auth} from '../middleware/auth';
import {Container} from 'typedi';
import {UserService} from '../../services/userService';

const router = Router();
const userService = () => Container.get(UserService);

router.get('/me', auth(true), async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({error: 'User authentication required'});
        }

        res.json(await userService().me(userId));
    } catch (e: unknown) {
        const error = e as Error;
        res.status(404).json({error: error.message});
    }
});

export default router;
