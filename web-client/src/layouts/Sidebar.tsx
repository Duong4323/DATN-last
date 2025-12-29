import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  BarChart2,
  ChevronLeft,
} from "lucide-react";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  isNew?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const sidebarItems: MenuItem[] = [
  { icon: <LayoutDashboard size={18} />, label: "Trang chính", path: "/admin/dashboard", isNew: true },
  { icon: <Users size={18} />, label: "Quản lý người dùng", path: "/admin/users" },
  { icon: <Package size={18} />, label: "Quản lý sản phẩm", path: "/admin/products" },
  { icon: <Package size={18} />, label: "Quản lý đơn hàng", path: "/admin/orders" },
  { icon: <BarChart2 size={18} />, label: "Thống kê thu chi", path: "/admin/finance" },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const renderItem = (item: MenuItem) => {
    const active = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 p-3 rounded-md mb-1 transition-all duration-200 ${
          active ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }`}
      >
        {item.icon}
        {isOpen && <span className="text-sm font-medium">{item.label}</span>}
        {item.isNew && isOpen && (
          <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
            NEW
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`bg-black text-white flex flex-col justify-between shadow-xl transition-all duration-300`}
      style={{
        width: isOpen ? "256px" : "64px",
        minWidth: isOpen ? "256px" : "64px",
      }}
    >
      {/* Logo */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-2 p-4 border-b border-gray-800">
          <div className="text-xl font-bold truncate">
            {isOpen ? "NBD System" : "NBDS"}
          </div>
        </div>

        {/* Menu */}
        <nav className="mt-4 px-2 overflow-y-auto">
          <h3 className="font-semibold p-2 text-sm text-white">Chức năng chính</h3>
          {sidebarItems.map(renderItem)}
        </nav>
      </div>

      {/* Nút thu gọn */}
      <footer className="p-2 border-t border-gray-800">
        <button
          onClick={toggleSidebar}
          className="w-full h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-150 rounded-md"
        >
          <ChevronLeft size={18} className={isOpen ? "" : "transform rotate-180"} />
          {isOpen && <span className="ml-2 text-sm">Thu gọn</span>}
        </button>
      </footer>
    </aside>
  );
};

export default Sidebar;
