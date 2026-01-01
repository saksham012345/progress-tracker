import React, { createContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load user if token exists (optional: verify token with backend)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.msg || 'Login failed');
        }

        setToken(data.token);
        setUser(data.user);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // Simple persistence
    };

    const signup = async (username, email, password) => {
        const res = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.msg || 'Signup failed');
        }

        setToken(data.token);
        setUser(data.user);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
