import axios from "axios";

// Đảm bảo bạn có cách để lấy token
const getAuthToken = () => localStorage.getItem('token');

const API_URL = `${import.meta.env.VITE_API_URL}/users`;

// 💡 Cấu hình Axios Client hoặc Interceptor để thêm token tự động là tốt nhất.
// Tuy nhiên, trong ví dụ này, chúng ta sẽ thêm thủ công vào từng hàm.
const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
        }
    };
};

export const getUsers = async () => {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
};

export const getUserById = async (id: number | string) => {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
};

export const createUser = async (data: any) => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const updateUser = async (id: number | string, data: any) => {
    const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
    return response.data;
};

export const deleteUser = async (id: number | string) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
};


// =======================================================
// HÀM: TẢI ẢNH PROFILE
// =======================================================

/**
 * Tải file ảnh lên server và nhận về URL công khai của ảnh.
 * Gọi: POST /api/users/upload-profile-image
 * @param file Tệp ảnh (File object)
 * @returns Promise<string> URL công khai của ảnh
 */
export const uploadProfileImage = async (file: File): Promise<string> => {
    
    const token = getAuthToken();
    if (!token) {
        throw new Error("Không tìm thấy token xác thực.");
    }
    
    const formData = new FormData();
    // 'image' phải khớp với tên trường trong Validation của UserController
    formData.append('image', file); 
    
    try {
        const response = await axios.post(
            `${API_URL}/upload-profile-image`, 
            formData,
            {
                headers: {
                    // Cần thiết khi gửi file
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`, 
                },
            }
        );
        
        // Backend trả về: { success: true, url: "http://..." }
        if (response.data && response.data.url) {
            return response.data.url;
        }
        
        throw new Error("Phản hồi server không hợp lệ.");

    } catch (error: any) {
        console.error("Upload failed:", error.response?.data || error);
        // Trích xuất thông báo lỗi chi tiết
        const serverMessage = error.response?.data?.message || 'Tải ảnh lên server thất bại.';
        throw new Error(serverMessage);
    }
    
};


// =======================================================
// HÀM BỔ SUNG: LẤY ẢNH PROFILE NGƯỜI DÙNG ĐANG ĐĂNG NHẬP
// =======================================================

interface ProfileImageResponse {
    profile_image_url: string | null;
}

/**
 * Lấy URL ảnh profile của người dùng đang được xác thực.
 * Gọi: GET /api/users/profile-image
 * @returns Promise<string | null> URL ảnh hoặc null
 */
export const getAuthenticatedUserProfileImage = async (): Promise<string | null> => {
    const token = getAuthToken();
    
    if (!token) {
        // Trả về null nếu không có token, coi như không có ảnh/chưa đăng nhập
        return null; 
    }

    try {
        const response = await axios.get<ProfileImageResponse>(
            `${API_URL}/profile-image`, 
            getAuthHeaders() // Yêu cầu Authorization Header
        );

        // Backend trả về: { profile_image_url: "http://..." | null }
        return response.data.profile_image_url || null;

    } catch (error: any) {
        // Bắt lỗi (ví dụ: 401 Unauthorized)
        console.error("Failed to fetch authenticated user profile image:", error.response?.data || error);
        return null; 
    }
};