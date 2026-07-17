import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface OrderProduct {
  product_id: number;
  product_name: string;
  color: string | null;
  size: string | null;
  quantity: number;
  price: number;
}

export interface OrderItemDetail {
  product_id: number;
  product_name: string;
  color: string | null;
  size: string | null;
  quantity?: number;
  price?: number;
}

export interface OrderHistoryItem {
  id: number;
  orderId: string;

  shop_id?: number;
  shop_name?: string | null;

  buyerName?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;

  products: string[];
  items_info: OrderItemDetail[];

  totalAmount: number;
  date: string;

  orderStatus?: string;
  paymentStatus?: string;

  statusKey: OrderStatus;
  paymentStatusKey: PaymentStatus;

  payment_status?: PaymentStatus;
  shipping_address: string;
}

export interface OrderPayload {
  items: OrderProduct[];
  total_amount: number;
  shipping_address: string;
  payment_method: "cod" | "transfer";
  payment_status: PaymentStatus;
}

export interface CreatedOrderItem {
  orderId: string;
  order_id_db: number;
  shop_id: number;
  total_amount: number;
}

export interface InsufficientStockItem {
  product_id: number;
  product_name: string;
  color: string | null;
  size: string | null;
  variant_label?: string;
  requested_quantity: number;
  remaining_quantity: number;
  message?: string;
}

export interface OrderCreationResponse {
  message: string;

  // Trường cũ nếu backend cũ trả về 1 đơn
  orderId?: string;
  order_id_db?: number;

  // Trường mới khi tách đơn theo từng shop
  orders?: CreatedOrderItem[];
  insufficient_items?: InsufficientStockItem[];
}

export interface MonthlyOrderStatistic {
  month: string;
  total_orders: number;
  pending_orders?: number;
  completed_orders: number;
  revenue: number;
  sold_products: number;
}

export interface ShopOrderStatistics {
  revenue: number;
  sold_products: number;
  pending_orders: number;
  completed_orders: number;
  total_orders: number;
  orders_by_month: MonthlyOrderStatistic[];
}

export interface ProductReview {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment: string;
  image_url: string | null;
  user?: { name: string };
  created_at: string;
}

export const getOrderHistory = async (): Promise<OrderHistoryItem[]> => {
  const response = await api.get<OrderHistoryItem[]>("/orders");
  return response.data;
};

export const getShopOrderStatistics = async (): Promise<ShopOrderStatistics> => {
  const response = await api.get<ShopOrderStatistics>("/orders/statistics");
  return response.data;
};

export const cancelOrder = async (
  orderId: number | string
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    `/orders/${orderId}/cancel`
  );

  return response.data;
};

export const returnOrder = async (
  orderId: number | string
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    `/orders/${orderId}/return`
  );

  return response.data;
};

export const createOrder = async (
  payload: OrderPayload
): Promise<OrderCreationResponse> => {
  const response = await api.post<OrderCreationResponse>("/orders", payload);
  return response.data;
};

export const updateOrder = async (
  orderId: number | string,
  updates: {
    status?: OrderStatus;
    payment_status?: PaymentStatus;
  }
): Promise<any> => {
  const response = await api.put(`/orders/${orderId}/status`, updates);
  return response.data;
};

export const submitReview = async (
  formData: FormData
): Promise<{ message: string; review: ProductReview }> => {
  const response = await api.post("/products/reviews", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getProductReviews = async (
  productId: number | string
): Promise<ProductReview[]> => {
  const response = await api.get<ProductReview[]>(
    `/products/${productId}/reviews`
  );

  return response.data;
};
