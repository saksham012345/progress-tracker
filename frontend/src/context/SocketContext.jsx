import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';

export const SocketContext = createContext();

// Strip /api suffix to get the base server URL for socket
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

export const SocketProvider = ({ children }) => {
    const { token, user } = useContext(AuthContext);
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);
    const retryRef = useRef(null);

    useEffect(() => {
        if (!token || !user) return;

        let s;
        let destroyed = false;

        const connect = () => {
            if (destroyed) return;

            s = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                auth: { token },
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 3000,
                reconnectionDelayMax: 10000,
                timeout: 20000,
            });

            s.on('connect', () => {
                console.log('🔌 Socket connected:', s.id);
                socketRef.current = s;
                setSocket(s);
            });

            s.on('disconnect', (reason) => {
                console.log('🔌 Socket disconnected:', reason);
                // Don't null out socket — let reconnection handle it
            });

            s.on('connect_error', (err) => {
                // Render free tier: server may be waking up — retry silently
                console.warn('Socket connect_error (will retry):', err.message);
            });
        };

        // Small delay so Render has time to wake up before socket attempts
        retryRef.current = setTimeout(connect, 1000);

        return () => {
            destroyed = true;
            clearTimeout(retryRef.current);
            if (s) {
                s.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
        };
    }, [token, user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
