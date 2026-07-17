import { RouteObject, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/user/Dashboard'; // Đây chính là UserContainer của bạn
import '../index.css';
import CartPage from '@/pages/user/Cart';

const userRoutes: RouteObject[] = [
  // 💡 THÊM ĐƯỜNG DẪN GỐC CHO KHÁCH VÀ USER
  {
    path: '/',
    element: <Dashboard />, 
  },
  {
    path: '/products',
    element: <Dashboard />,
  },
  {
    path: '/user',
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'cart', element: <CartPage /> },
      // Tự động chuyển hướng /user về /user/dashboard
      { path: '', element: <Navigate to="dashboard" /> }, 
    ],
  },
];

export default userRoutes;
