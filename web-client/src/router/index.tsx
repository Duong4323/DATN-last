import { useRoutes, Navigate } from 'react-router-dom';

import Login from '@/pages/login/login';
import Register from '@/pages/login/Register';

import adminRoutes from './admin';
import userRoutes from './duong';
import shopRoutes from './shop';

import '../index.css';

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
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/register',
      element: <Register />,
    },
  ];

  let routes;

  if (role === 'admin') {
    routes = [
      ...commonRoutes,
      ...adminRoutes,
      ...userRoutes,
      {
        path: '/',
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: '*',
        element: <Navigate to="/admin/dashboard" replace />,
      },
    ];
  } else if (role === 'shop_owner') {
    routes = [
      ...commonRoutes,
      ...shopRoutes,
      ...userRoutes,
      {
        path: '/',
        element: <Navigate to="/shop/dashboard" replace />,
      },
      {
        path: '*',
        element: <Navigate to="/shop/dashboard" replace />,
      },
    ];
  } else if (role === 'user') {
    routes = [
      ...commonRoutes,
      ...userRoutes,
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ];
  } else {
    routes = [
      ...commonRoutes,
      ...userRoutes,
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ];
  }

  return useRoutes(routes);
}