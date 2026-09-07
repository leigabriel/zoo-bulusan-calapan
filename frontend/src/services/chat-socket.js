import { io } from 'socket.io-client';
import { BACKEND_BASE_URL, getToken } from './api-client';

export const connectChatSocket = (role = 'user') => io(BACKEND_BASE_URL, {
    auth: { token: getToken(role) },
    transports: ['websocket', 'polling'],
    reconnection: true
});

export const createChatSocket = connectChatSocket;
