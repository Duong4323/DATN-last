import axios from 'axios';

/**
 * Hàm này cấu hình Axios để tự động đính kèm token Sanctum.
 * Cần được gọi khi ứng dụng khởi động và sau khi đăng nhập/đăng xuất.
 */
export const setupAxiosInterceptors = () => {
    // 1. Lấy token
    const token = localStorage.getItem('token'); 
    
    if (token) {
        // 2. Đặt header Authorization
        // Axios cần cấu hình này để gửi token đến Laravel
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log("Axios setup: Token Sanctum đã được đặt.");
    } else {
        // 3. Xóa header nếu không có token
        delete axios.defaults.headers.common['Authorization'];
        console.log("Axios setup: Không tìm thấy token.");
    }
};