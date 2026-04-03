import { DefaultEventsMap, Socket as DefaultSocket } from 'socket.io';
import { JWTPayload } from './jwt-payload';

export type Socket = DefaultSocket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, { UserData: JWTPayload }>;

export enum MessageType {
    CHAT_JOIN = 'chat:join',
    CHAT_JOINED = 'chat:joined',
    CHAT_LEAVE = 'chat:leave',
    CHAT_LEFT = 'chat:left',
    CHAT_CREATED = 'chat:created',
    MESSAGE_BROADCAST = 'message:broadcast',
}

export enum EventType {
    CHAT_CREATED = 'CHAT_CREATED',
    MESSAGE_SAVED = 'MESSAGE_SAVED',
}
