import React from "react";
import { Link } from "react-router-dom"; 

const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      
      {/* Breadcrumb và Tiêu đề */}
      <h2 className="text-xl font-semibold text-gray-700 mb-1">Dashboard</h2>
      <div className="text-sm text-gray-500 mb-6">
        <Link to="/admin/dashboard" className="hover:text-blue-600">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span>Dashboard</span>
      </div>

      {/* Các Card Số liệu (Widgets) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Card: Tổng số người dùng */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-start">
          <p className="text-sm text-gray-500 mb-2">Tổng số người dùng</p>
          <p className="text-5xl font-bold text-gray-900 mb-4">1,250</p>
        </div>

        {/* Card: Tổng số sản phẩm (Có nút Cập nhật) */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-start">
          <p className="text-sm text-gray-500 mb-2">Tổng số sản phẩm</p>
          <p className="text-5xl font-bold text-gray-900 mb-4">580</p>
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">
            Cập nhật
          </button>
        </div>

        {/* Card: Doanh thu tháng này */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-start">
          <p className="text-sm text-gray-500 mb-2">Doanh thu tháng này</p>
          <p className="text-5xl font-bold text-green-600 mb-4">+25.3%</p>
        </div>

        {/* Card: Số lượng đơn hàng */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-start">
          <p className="text-sm text-gray-500 mb-2">Số lượng đơn hàng</p>
          <p className="text-5xl font-bold text-gray-900 mb-4">35</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl border shadow-sm">
         <h3 className="text-lg font-semibold text-gray-800">Dữ liệu chi tiết</h3>
         <p className="text-gray-600 mt-2">Nơi đặt các biểu đồ, bảng dữ liệu lớn...</p>
      </div>
    </div>
  );
};

export default Dashboard;