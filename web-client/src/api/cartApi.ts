import axios from "axios";

// Đặt base URL cho Cart API
const API_URL = `${import.meta.env.VITE_API_URL}/cart`;

// --- Định nghĩa Kiểu dữ liệu ---

// Kiểu dữ liệu nhận được từ API khi tải giỏ hàng
export interface CartItem {
    product_id: number;
    name: string;
    quantity: number;
    price: number;
    thumbnail_url: string | null;
}

// ----------------------------------------------------
// CÁC HÀM API GIỎ HÀNG
// ----------------------------------------------------

/**
 * Lấy nội dung giỏ hàng hiện tại của người dùng đã đăng nhập.
 * (GET /api/cart)
 */
export const getCart = async (): Promise<CartItem[]> => {
    // API này yêu cầu token xác thực (auth:sanctum)
    const response = await axios.get<CartItem[]>(API_URL);
    return response.data;
};

/**
 * Thêm sản phẩm vào giỏ hàng hoặc tăng số lượng.
 * (POST /api/cart)
 * @param productId ID của sản phẩm.
 * @param quantity Số lượng muốn thêm (mặc định là 1).
 */
export const addToCart = async (productId: number, quantity: number = 1): Promise<CartItem[]> => {
    const response = await axios.post<CartItem[]>(API_URL, {
        product_id: productId,
        quantity: quantity,
    });
    return response.data; // Trả về giỏ hàng mới
};

/**
 * Cập nhật số lượng của một mục hàng đã có trong giỏ.
 * (PUT /api/cart/{productId})
 * @param productId ID của sản phẩm cần cập nhật.
 * @param newQuantity Số lượng mới (phải lớn hơn 0).
 */
export const updateCartItem = async (productId: number, newQuantity: number): Promise<CartItem[]> => {
    const response = await axios.put<CartItem[]>(`${API_URL}/${productId}`, {
        quantity: newQuantity,
    });
    return response.data; // Trả về giỏ hàng mới
};

/**
 * Xóa mục hàng khỏi giỏ.
 * (DELETE /api/cart/{productId})
 * @param productId ID của sản phẩm cần xóa.
 */
export const removeFromCart = async (productId: number): Promise<any> => {
    const response = await axios.delete(`${API_URL}/${productId}`);
    return response.data; 
};