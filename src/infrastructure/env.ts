export const MONGO_URI = process.env.MONGO_URI || 'mongodb://username:password@localhost:27017/database?authSource=admin';
export const JWT_SECRET = process.env.JWT_SECRET || 'secret';
export const APP_PORT = parseInt(process.env.APP_PORT || '3000');