import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message } from 'antd';
import axios from 'axios';

const LogoutButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    
    // Lấy token đã lưu từ localStorage
    const token = localStorage.getItem('token');

    // Cấu hình Axios để gửi token trong header Authorization
    const axiosConfig = {
      headers: {
        // Định dạng BẮT BUỘC phải là 'Bearer <token>'
        Authorization: token ? `Bearer ${token}` : '',
      },
    };

    try {
      if (!token) {
        // Nếu không có token, bỏ qua việc gọi API server vì nó chắc chắn sẽ lỗi 401
        message.warning('Không tìm thấy token. Đã đăng xuất cục bộ.');
        // Bỏ qua lỗi và nhảy thẳng xuống finally để xóa dữ liệu cục bộ
      } else {
        // Giả định URL API đăng xuất: /api/auth/logout
        // Thay thế bằng URL thực tế của bạn nếu cần
        await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/logout`,
          {}, // Body rỗng
          axiosConfig // Truyền token vào cấu hình
        );
        message.success('Đăng xuất thành công!');
      }

    } catch (err: any) {
      // Xử lý lỗi từ server (có thể là lỗi 401 nếu token hết hạn)
      const msg = err.response?.data?.message || err.response?.data?.error || 'Đăng xuất thất bại. Đang xóa dữ liệu cục bộ.';
      message.error(msg);
      console.error("Logout API Error:", err);

    } finally {
      // Dù API có lỗi hay không, chúng ta luôn xóa token và thông tin người dùng 
      // khỏi trình duyệt để đảm bảo trạng thái đăng xuất cục bộ.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setLoading(false);
      // Chuyển hướng người dùng về trang đăng nhập
      navigate('/login');
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      loading={loading}
      danger // Dùng màu đỏ cho nút đăng xuất
    >
      Đăng Xuất
    </Button>
  );
};

export default LogoutButton;