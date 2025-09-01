import 'reflect-metadata';
import {APP_PORT, MONGO_URI} from "./src/infrastructure/env.ts";
import {serverInstance, setServerInstance} from "./src/infrastructure/container.ts";

await setServerInstance(APP_PORT, MONGO_URI);
serverInstance.httpServer.listen(APP_PORT, () => console.log(`Server listening on ${APP_PORT}`));
