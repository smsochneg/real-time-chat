import { JWTPayload } from './jwt-payload';

declare module 'express' {
    interface Request {
        UserData: JWTPayload;
    }
}
