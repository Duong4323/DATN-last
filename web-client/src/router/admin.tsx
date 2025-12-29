import { RouteObject, Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import UserManagement from "@/pages/admin/UserManagement";
import Products from "@/pages/admin/Products";
import Finance from "@/pages/admin/Finance";
import "../index.css";
import AdminOrderManagement from "@/pages/admin/AdminOrderManagement";
const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      // 👉 Khi vào /admin, tự động chuyển hướng đến /admin/dashboard
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },

      // 🏠 Dashboard chính
      { path: "dashboard", element: <Dashboard /> },

      // 👥 Quản lý người dùng
      { path: "users", element: <UserManagement /> },

      // 📦 Quản lý sản phẩm
      { path: "products", element: <Products /> },
      { path: "orders", element: <AdminOrderManagement /> },

      // 💰 Thống kê thu chi
      { path: "finance", element: <Finance /> },
    ],
  },
];

export default adminRoutes;
