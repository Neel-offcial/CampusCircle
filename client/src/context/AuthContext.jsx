import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campuscircle_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('campuscircle_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('campuscircle_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    }
    verifyUser();
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('campuscircle_token', newToken);
    localStorage.setItem('campuscircle_user', JSON.stringify(newUser));
    return newUser;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register/complete', userData);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('campuscircle_token', newToken);
    localStorage.setItem('campuscircle_user', JSON.stringify(newUser));
    return newUser;
  };

  const initiateRegister = async (userData) => {
    const res = await api.post('/auth/register/initiate', userData);
    return res.data;
  };

  const completeRegister = async (otpData) => {
    const res = await api.post('/auth/register/complete', otpData);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('campuscircle_token', newToken);
    localStorage.setItem('campuscircle_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('campuscircle_token');
    localStorage.removeItem('campuscircle_user');
  };

  const updateProfile = async (updatedFields) => {
    const res = await api.put('/auth/profile', updatedFields);
    setUser(res.data.user);
    localStorage.setItem('campuscircle_user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const sendEduOtp = async (email) => {
    const res = await api.post('/auth/edu/send-otp', { email });
    return res.data;
  };

  const verifyEduOtp = async (otp) => {
    const res = await api.post('/auth/edu/verify-otp', { otp });
    setUser(res.data.user);
    localStorage.setItem('campuscircle_user', JSON.stringify(res.data.user));
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        isVerified: Boolean(user?.isVerified),
        login,
        register,
        initiateRegister,
        completeRegister,
        logout,
        updateProfile,
        sendEduOtp,
        verifyEduOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
