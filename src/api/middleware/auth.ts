import type {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {JWT_SECRET} from '../../config/env';

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export function auth(required = true) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const payload = jwt.verify(token, JWT_SECRET) as { id: string };
                req.userId = payload.id;
            } catch {
                if (required) return res.status(401).json({error: 'invalid token'});
            }
        } else if (required) {
            return res.status(401).json({error: 'missing token'});
        }
        next();
    };
}
