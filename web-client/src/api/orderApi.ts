import axios from "axios";

// Đặt base URL cho Order API
const API_BASE_URL = `${import.meta.env.VITE_API_URL}`; 

// Tạo một instance axios với cấu hình base URL và interceptor
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Tự động thêm Bearer Token (Đã được cấu hình)
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});


// --- Định nghĩa Kiểu dữ liệu ---

// Kiểu dữ liệu cho Chi tiết Sản phẩm trong đơn hàng
export interface OrderProduct {
    product_name: string;
    quantity: number;
    price: number;
    product_id: number; 
}

// Kiểu dữ liệu nhận được từ API khi tải lịch sử đơn hàng
export interface OrderHistoryItem {
    id: number;
    orderId: string; 
    buyerName: string;
    products: string[]; 
    totalAmount: number;
    date: string;
    orderStatus: string; 
    paymentStatus: string; 
    statusKey: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'; 
    paymentStatusKey: 'unpaid' | 'paid' | 'refunded'; 
}

// 💡 Kiểu dữ liệu cho Payload TẠO ĐƠN HÀNG (Dùng trong createOrder)
export interface OrderPayload {
    items: OrderProduct[]; 
    total_amount: number;
    shipping_address: string;
    payment_method: 'cod' | 'transfer';
    payment_status: 'paid' | 'unpaid' | 'refunded';
}

// 💡 Kiểu dữ liệu Phản hồi TẠO ĐƠN HÀNG
export interface OrderCreationResponse {
    orderId: string; 
    message: string;
    order_id_db: number; 
}

// ----------------------------------------------------
// CÁC HÀM API ĐƠN HÀNG
// ----------------------------------------------------

/**
 * Lấy lịch sử đơn hàng của người dùng hiện tại (hoặc Admin xem tất cả).
 * (GET /api/orders)
 */
export const getOrderHistory = async (): Promise<OrderHistoryItem[]> => {
    const response = await api.get<OrderHistoryItem[]>('/orders');
    return response.data;
};

/**
 * Hủy một đơn hàng cụ thể.
 * (POST /api/orders/{orderId}/cancel)
 */
export const cancelOrder = async (orderId: number | string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/orders/${orderId}/cancel`);
    return response.data; 
};

/**
 * 🎯 HÀM TẠO ĐƠN HÀNG MỚI (CHECKOUT)
 * (POST /api/orders)
 */
export const createOrder = async (payload: OrderPayload): Promise<OrderCreationResponse> => {
    // Gọi đến endpoint /api/orders
    const response = await api.post<OrderCreationResponse>('/orders', payload);
    return response.data;
};


// ****************************************************
// CHỨC NĂNG ADMIN
// ****************************************************

/**
 * [ADMIN ONLY] Cập nhật trạng thái Đơn hàng (status) và/hoặc Thanh toán (payment_status).
 * (PUT /api/orders/{orderId}/status)
 * @param orderId ID đơn hàng.
 * @param updates Đối tượng chứa các trường cần cập nhật (status, payment_status).
 */
export const updateOrder = async (
    orderId: number | string, 
    updates: { 
        status?: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled',
        payment_status?: 'unpaid' | 'paid' | 'refunded'
    }
): Promise<any> => {
    // Gọi đến endpoint /api/orders/{orderId}/status
    // Controller Backend chấp nhận status và payment_status trong body
    const response = await api.put(`/orders/${orderId}/status`, updates);
    return response.data;
};