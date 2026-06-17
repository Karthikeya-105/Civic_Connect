import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (localStorage.getItem('token')) {
                await refreshUser();
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Login failed' };
        } finally {
            setLoading(false);
        }
    };

    const signup = async (name, email, password, phone) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/signup', { name, email, password, phone });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Signup failed' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = (updatedUser) => {
        const merged = { ...user, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(merged));
        setUser(merged);
    };

    const refreshUser = async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(prev => ({ ...prev, ...data }));
            // Also update localStorage with the latest data
            const stored = localStorage.getItem('user');
            const merged = { ...(stored ? JSON.parse(stored) : {}), ...data };
            localStorage.setItem('user', JSON.stringify(merged));
        } catch (err) {
            if (err.response?.status === 401) {
                logout();
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout, updateUser, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
