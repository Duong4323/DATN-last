import React, { useEffect } from 'react'; // Import useEffect
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router';
import './index.css';

// Giả định file này chứa hàm để cấu hình Axios gửi token
import { setupAxiosInterceptors } from './axiosConfig'; 

const App: React.FC = () => {
  
  useEffect(() => {
    // Gọi hàm setup ngay khi ứng dụng mount
    setupAxiosInterceptors();
    
    // Thêm logic theo dõi thay đổi localStorage (ví dụ: sau khi đăng nhập thành công)
    // Nếu hàm setupAxiosInterceptors không tự cập nhật sau đăng nhập, bạn cần 
    // đảm bảo nó được gọi lại mỗi khi token được lưu mới.
    
    // Nếu bạn muốn xử lý tự động khi localStorage thay đổi:
    const handleStorageChange = () => {
      setupAxiosInterceptors(); 
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
};

export default App;