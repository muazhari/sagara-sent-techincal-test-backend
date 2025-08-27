import {buildServer} from './src/infrastructure/server';
import {PORT} from './src/config/env';

(async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI environment variable is not set');
    }
    const {httpServer} = await buildServer(mongoUri);
    httpServer.listen(PORT, () => console.log(`Server listening on ${PORT}`));
})();
