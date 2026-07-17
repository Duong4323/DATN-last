import axios from "axios";

// Đặt base URL cho Cart API
const API_URL = `${import.meta.env.VITE_API_URL}/cart`;

// --- Định nghĩa Kiểu dữ liệu ---

export interface CartItem {
    id: number;          // ID của dòng trong bảng carts (giúp thao tác chính xác hơn)
    product_id: number;
    name: string;
    size: string | null;
    color: string | null;
    quantity: number;
    price: number;
    thumbnail_url: string | null;
    max_stock?: number;
}

// ----------------------------------------------------
// CÁC HÀM API GIỎ HÀNG
// ----------------------------------------------------

/**
 * Lấy nội dung giỏ hàng hiện tại của người dùng đã đăng nhập.
 * (GET /api/cart)
 */
export const getCart = async (): Promise<CartItem[]> => {
    const response = await axios.get<CartItem[]>(API_URL);
    return response.data;
};

/**
 * Thêm sản phẩm vào giỏ hàng hoặc tăng số lượng.
 * (POST /api/cart)
 * @param productId ID của sản phẩm.
 * @param quantity Số lượng muốn thêm.
 * @param size Kích cỡ khách hàng chọn (Bắt buộc).
 */
export const addToCart = async (productId: number, quantity: number = 1, size?: string | null, color?: string | null): Promise<CartItem[]> => {
    // 💡 Bây giờ hàm nhận 3 tham số, lỗi ở ProductDetailPage sẽ biến mất
    const response = await axios.post<CartItem[]>(API_URL, {
        product_id: productId,
        quantity: quantity,
        size: size,
        color: color ?? null,
    });
    return response.data;
};

/**
 * Cập nhật số lượng của một mục hàng đã có trong giỏ.
 * (PUT /api/cart/{productId})
 * @param size Cần size để Backend tìm đúng dòng sản phẩm cụ thể.
 */
export const updateCartItem = async (productId: number, newQuantity: number, size?: string | null, color?: string | null): Promise<CartItem[]> => {
    const response = await axios.put<CartItem[]>(`${API_URL}/${productId}`, {
        quantity: newQuantity,
        size: size,
        color: color ?? null,
    });
    return response.data;
};

/**
 * Xóa mục hàng khỏi giỏ.
 * (DELETE /api/cart/{productId})
 * @param productId ID sản phẩm.
 * @param size Kích cỡ của sản phẩm cần xóa.
 */
export const removeFromCart = async (productId: number, size?: string | null, color?: string | null): Promise<any> => {
    const response = await axios.delete(`${API_URL}/${productId}`, {
        params: { size, color: color ?? null } // 💡 Truyền size/color qua Query Params
    });
    return response.data; 
};
