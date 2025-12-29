import { RouteObject } from 'react-router-dom';
import Dashboard from '@/pages/user/Dashboard';
import '../index.css';
import CartPage from '@/pages/user/Cart';
const userRoutes: RouteObject[] = [
  {
    path: '/user',
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'cart', element: <CartPage /> },
    ],
    
  },
];

export default userRoutes;
