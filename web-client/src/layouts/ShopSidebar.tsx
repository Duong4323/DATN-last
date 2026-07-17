import React from "react";
import { NavLink } from "react-router-dom";
import { ClipboardList, LayoutDashboard, Package, Store } from "lucide-react";

interface ShopSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
    isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
  }`;

const ShopSidebar: React.FC<ShopSidebarProps> = ({ isOpen }) => {
  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-white shadow-md h-screen transition-all duration-300 overflow-hidden`}
    >
      <div className="h-16 flex items-center justify-center border-b">
        <h1 className="font-bold text-lg text-gray-800">
          {isOpen ? "Shop Panel" : "Shop"}
        </h1>
      </div>

      <nav className="p-4 space-y-2">
        <NavLink to="/shop/dashboard" className={navLinkClass}>
          <LayoutDashboard size={20} />
          {isOpen && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/shop/products" className={navLinkClass}>
          <Package size={20} />
          {isOpen && <span>Quản lý sản phẩm</span>}
        </NavLink>

        <NavLink to="/shop/orders" className={navLinkClass}>
          <ClipboardList size={20} />
          {isOpen && <span>Quản lý đơn hàng</span>}
        </NavLink>

        <NavLink to="/shop/profile" className={navLinkClass}>
          <Store size={20} />
          {isOpen && <span>Thông tin cửa hàng</span>}
        </NavLink>
      </nav>
    </aside>
  );
};

export default ShopSidebar;
