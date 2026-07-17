import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import ShopSidebar from "@/layouts/ShopSidebar";
import LogoutButton from "@/pages/login/LogoutButton";

const ShopLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar bên trái */}
      <ShopSidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Nội dung bên phải */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center bg-white px-6 py-3 shadow-sm z-20">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-sm text-gray-800">
                  {user?.name}
                </p>

                <p className="text-xs text-gray-500">
                  Chủ cửa hàng
                </p>
              </div>

              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Khu vực nội dung chính */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ShopLayout;