import React from 'react';
import { useRoutes, Navigate } from 'react-router-dom';
import Login from '@/pages/login/login';
import adminRoutes from './admin';
import userRoutes from './user';
import '../index.css';
import Register from '@/pages/login/Register';
const getUserRole = (): string | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.role || null;
  } catch {
    return null;
  }
};

export default function AppRouter() {
  const role = getUserRole();

  const commonRoutes = [
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    {
      path: '/',
      element: <Navigate to={role === 'admin' ? '/admin/dashboard' : role === 'user' ? '/user/dashboard' : '/login'} />,
    },
  ];

  const routes = role === 'admin'
    ? [...commonRoutes, ...adminRoutes]
    : role === 'user'
      ? [...commonRoutes, ...userRoutes]
      : commonRoutes;

  return useRoutes(routes);
}
