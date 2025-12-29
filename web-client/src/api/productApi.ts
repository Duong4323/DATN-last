import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/products`;

// --- Định nghĩa Kiểu dữ liệu ---

/**
 * Định nghĩa kiểu dữ liệu cho một bản ghi ảnh sản phẩm từ bảng product_images
 */
export interface ProductImage {
    id: number;
    product_id: number;
    url: string;
    is_thumbnail: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
}

/**
 * Định nghĩa kiểu dữ liệu cơ bản cho Sản phẩm
 */
export interface Product {
    id: number;
    name: string;
    // Bỏ image_url, thay bằng các quan hệ
    description: string | null;
    categories: Category[]; 
    price: number;
    quantity: number;
    sold: number;
    
    // Thuộc tính ảo (Accessor) từ Laravel để hiển thị ảnh chính
    thumbnail_url: string | null; 
    // Quan hệ One-to-Many để truy cập tất cả các ảnh
    images: ProductImage[];
    
    remaining: number; 
    created_at: string;
    updated_at: string;
}

// ----------------------------------------------------
// CÁC HÀM API CHÍNH
// ----------------------------------------------------

/**
 * Lấy danh sách tất cả sản phẩm (Có thể lọc theo categoryKey)
 * @param categoryKey Tham số lọc tùy chọn (ví dụ: 'men', 'sport')
 */
export const getProducts = async (categoryKey?: string): Promise<Product[]> => {
    let url = API_URL;
    
    // Nếu có key và không phải 'home', thêm tham số query vào URL
    if (categoryKey && categoryKey !== 'home') {
        url = `${API_URL}?categoryKey=${categoryKey}`;
    }

    const response = await axios.get<Product[]>(url);
    return response.data;
};

/**
 * Lấy chi tiết sản phẩm theo ID
 * @param {number | string} id ID của sản phẩm
 */
export const getProductById = async (id: number | string): Promise<Product> => {
    const response = await axios.get<Product>(`${API_URL}/${id}`);
    return response.data;
};

/**
 * Thêm sản phẩm mới
 * @param {data} Dữ liệu sản phẩm. Cần gửi 'image_urls' là mảng các URL string.
 */
export const createProduct = async (data: {
    name: string;
    description: string;
    price: number;
    quantity: number;
    categories: number[];
    image_urls: string[]; // MẢNG CÁC URL
}): Promise<Product> => {
    const response = await axios.post<Product>(API_URL, data);
    return response.data;
};

/**
 * Cập nhật thông tin sản phẩm
 * @param {id} ID của sản phẩm cần cập nhật
 * @param {data} Dữ liệu cập nhật. Cần gửi 'image_urls' là mảng các URL string để đồng bộ.
 */
export const updateProduct = async (id: number | string, data: {
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    categories?: number[];
    image_urls?: string[]; // MẢNG CÁC URL
}): Promise<Product> => {
    // Sử dụng PUT để đảm bảo toàn bộ tài nguyên được cập nhật
    const response = await axios.put<Product>(`${API_URL}/${id}`, data);
    return response.data;
};

/**
 * Xóa sản phẩm
 */
export const deleteProduct = async (id: number | string): Promise<any> => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data; 
};

/**
 * Upload ảnh sản phẩm (chỉ xử lý 1 file/lần)
 */
export const uploadProductImage = async (imageFile: File): Promise<{ message: string, image_url: string }> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.post<{ message: string, image_url: string }>(
        `${API_URL}/upload-image`, 
        formData, 
        {
            headers: {
                'Content-Type': 'multipart/form-data' // Bắt buộc cho file upload
            }
        }
    );
    return response.data;
};