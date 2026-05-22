import React, { createContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // On mount: validate token against backend. If invalid, clear it.
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) { setLoading(false); return; }

        fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${storedToken}` }
        })
            .then(res => {
                if (res.ok) return res.json();
                // Token rejected by server — clear everything
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setUser(null);
                return null;
            })
            .then(data => {
                if (data) {
                    setUser(data);
                    setToken(storedToken);
                    localStorage.setItem('user', JSON.stringify(data));
                }
            })
            .catch(() => {
                // Network error — fall back to cached user so app still loads offline
                const cached = localStorage.getItem('user');
                if (cached) setUser(JSON.parse(cached));
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Login failed');

        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    };

    const signup = async (username, email, password) => {
        const res = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Signup failed');

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

    const refreshUser = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
            }
        } catch (err) {
            console.error('Refresh User Error:', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, refreshUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
