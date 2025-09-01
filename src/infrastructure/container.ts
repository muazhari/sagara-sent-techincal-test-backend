import {buildServer, type ServerInstance} from './server';

export let serverInstance: ServerInstance;

export const setServerInstance = async (appPort: number, mongoUri: string) => {
    serverInstance = await buildServer(mongoUri);

    await new Promise<void>((resolve) => {
        const httpServer = serverInstance.httpServer.listen(appPort, () => {
            serverInstance.port = (httpServer.address() as any).port;
            resolve();
        });
    });
}
