import {Container} from "typedi";
import {UserService} from "../services/userService.ts";
import {MessageService} from "../services/messageService.ts";
import {AuthService} from "../services/authService.ts";
import {RoomService} from "../services/roomService.ts";
import type {ServerInstance} from "./server.ts";


export const userService = Container.get(UserService);
export const messageService = Container.get(MessageService);
export const authService = Container.get(AuthService);
export const roomService = Container.get(RoomService);
export let serverInstance: ServerInstance;

export const setServerInstance = (instance: ServerInstance) => {
    serverInstance = instance;
}


