import 'reflect-metadata';
import {APP_PORT, MONGO_URI} from "./src/infrastructure/env.ts";
import {buildServer, type ServerInstance} from "./src/infrastructure/server.ts";
import {setServerInstance} from "./src/infrastructure/container.ts";

const serverInstance: ServerInstance = await buildServer(MONGO_URI)
setServerInstance(serverInstance)
serverInstance.httpServer.listen(APP_PORT, () => console.log(`Server listening on ${APP_PORT}`));
