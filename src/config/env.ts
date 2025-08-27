import 'reflect-metadata';

export const JWT_SECRET = process.env.JWT_SECRET || 'secret';
export const PORT = parseInt(process.env.APP_PORT || '3000', 10);

