import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { token, user } = useContext(AuthContext);
    const socketRef = useRef();

    useEffect(() => {
        if (token && user) {
            socketRef.current = io(API_URL.replace('/api', ''), {
                transports: ['websocket'],
                query: { token }
            });

            console.log('🔌 Socket Connected');

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
            };
        }
    }, [token, user]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current }}>
            {children}
        </SocketContext.Provider>
    );
};
