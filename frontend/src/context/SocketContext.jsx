import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';

export const SocketContext = createContext();

// Strip /api suffix and trailing slash to get the base server URL
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

export const SocketProvider = ({ children }) => {
    const { token, user } = useContext(AuthContext);
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!token || !user) return;

        const s = io(SOCKET_URL, {
            transports: ['websocket', 'polling'], // polling fallback for Render
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        s.on('connect', () => console.log('🔌 Socket connected:', s.id));
        s.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));
        s.on('connect_error', (err) => console.warn('Socket error:', err.message));

        socketRef.current = s;
        setSocket(s);

        return () => {
            s.disconnect();
            socketRef.current = null;
            setSocket(null);
        };
    }, [token, user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
