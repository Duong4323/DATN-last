import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const DashboardLayout: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/users", label: "Quản lý Users" },
    { path: "/admin/products", label: "Quản lý Sản phẩm" },
    { path: "/admin/orders", label: "Quản lý Đơn hàng" },
    { path: "/admin/statistics", label: "Thống kê Thu Chi" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-6 text-blue-600">Admin Panel</h2>
        <nav className="flex flex-col gap-3">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`p-2 rounded-lg transition ${
                location.pathname === item.path
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-blue-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="mb-6 border-b pb-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <span className="text-gray-600">Xin chào, Admin 👋</span>
        </header>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <Outlet /> {/* nơi hiển thị nội dung từng trang con */}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
