import React, { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeFromCart, CartItem } from '../../api/cartApi'; 
import { message, Modal, Radio, Divider, Button,Space, Spin } from 'antd'; 
import { createOrder, OrderPayload, OrderCreationResponse } from '../../api/orderApi'; // 💡 Import OrderPayload

// URL ảnh QR Code mẫu (Thay thế bằng QR Code thực tế của bạn)
const MOCK_QR_CODE_URL = "https://i.imgur.com/k9tBw2v.png";

const CartPage: React.FC = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // --- State cho Modal Thanh toán ---
    const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');
    const [isOrderCreating, setIsOrderCreating] = useState(false);
    
    const navigate = useNavigate();

    // --- Tính toán Tổng cộng ---
    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    // --- Tải dữ liệu giỏ hàng (Giữ nguyên) ---
    useEffect(() => {
        const fetchCartData = async () => {
            try {
                setIsLoading(true);
                const data = await getCart(); 
                setCartItems(data);
            } catch (err: any) {
                console.error("Lỗi khi tải giỏ hàng:", err);
                setError(err.response?.status === 401 ? "Vui lòng đăng nhập để xem giỏ hàng." : "Lỗi tải giỏ hàng.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCartData();
    }, []);

    // --- Xử lý Thay đổi Số lượng (Giữ nguyên) ---
    const handleQuantityChange = async (productId: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        setCartItems(cartItems.map(item => 
            item.product_id === productId ? { ...item, quantity: newQuantity } : item
        ));

        try {
            await updateCartItem(productId, newQuantity); 
        } catch (err) {
            message.error("Không thể cập nhật số lượng.");
        }
    };

    // --- Xử lý Xóa mục hàng (Giữ nguyên) ---
    const handleRemoveItem = async (productId: number, name: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}" khỏi giỏ hàng?`)) {
            return;
        }

        try {
            await removeFromCart(productId); 
            setCartItems(cartItems.filter(item => item.product_id !== productId));
            message.success(`Đã xóa "${name}" khỏi giỏ hàng.`);
        } catch (err) {
            message.error("Xóa mục hàng thất bại.");
        }
    };
    
    // --- XỬ LÝ TẠO ĐƠN HÀNG VÀ THANH TOÁN (ĐÃ SỬA LỖI) ---

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            message.warning("Giỏ hàng của bạn đang trống.");
            return;
        }
        setIsCheckoutModalVisible(true);
    };

    const handleCreateOrder = async () => {
        setIsOrderCreating(true);
        setError(null);
        
        const mockShippingAddress = "123 Đường ABC, Quận XYZ, TP.HCM"; 

        try {
            // FIX LỖI: Gán trực tiếp giá trị literal 'unpaid' để thỏa mãn kiểu union type
            const paymentStatusKey: OrderPayload['payment_status'] = 'unpaid';
            
            const orderPayload: OrderPayload = { // 💡 Định nghĩa kiểu cho payload
                items: cartItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    product_name: item.name,
                })),
                total_amount: calculateTotal(),
                shipping_address: mockShippingAddress,
                payment_method: paymentMethod, 
                payment_status: paymentStatusKey, // 💡 Đã sửa lỗi type mismatch
            };

            const response: OrderCreationResponse = await createOrder(orderPayload);

            message.success(`Đơn hàng #${response.orderId} đã được tạo thành công!`);
            
            setCartItems([]);
            setIsCheckoutModalVisible(false);
            navigate('/user/orders'); 
            
        } catch (err: any) {
            console.error("Lỗi tạo đơn hàng:", err);
            message.error(err.response?.data?.message || "Tạo đơn hàng thất bại. Vui lòng thử lại.");
        } finally {
            setIsOrderCreating(false);
        }
    };

    // --- RENDER UI (Giữ nguyên) ---

    if (isLoading) return <div className="text-center py-16 text-indigo-600"><Spin size="large" /> Đang tải giỏ hàng...</div>;
    if (error) return <div className="text-center py-16 text-red-600 font-bold">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto py-10">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8">
                🛍️ Giỏ Hàng Của Bạn
            </h1>

            {cartItems.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl shadow-lg border border-gray-200">
                    <p className="text-2xl font-medium text-gray-700 mb-4">Giỏ hàng của bạn đang trống!</p>
                    <Link to="/" className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center justify-center">
                        Tiếp tục mua sắm <ArrowRight size={18} className="ml-2" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="lg:col-span-2 space-y-6">
                        {cartItems.map((item) => (
                            <div key={item.product_id} className="flex items-center bg-white p-4 rounded-xl shadow-md border border-gray-100 transition duration-150">
                                
                                <Link to={`/product/${item.product_id}`} className="flex-shrink-0">
                                    <img 
                                        src={item.thumbnail_url || 'https://placehold.co/80x80/E0E7FF/3730A3?text=SP'} 
                                        alt={item.name} 
                                        className="w-20 h-20 object-cover rounded-lg mr-4" 
                                    />
                                </Link>

                                <div className="flex-grow">
                                    <Link to={`/product/${item.product_id}`} className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition">
                                        {item.name}
                                    </Link>
                                    <p className="text-sm text-gray-500">Giá đơn vị: {item.price.toLocaleString('vi-VN')} ₫</p>
                                </div>

                                <div className="flex items-center mx-4">
                                    <button 
                                        onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-l-lg border border-r-0"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="px-4 py-2 border-y text-lg font-medium">{item.quantity}</span>
                                    <button 
                                        onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-lg border border-l-0"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <div className="text-right ml-4 flex-shrink-0">
                                    <p className="text-xl font-bold text-red-600 mb-1">
                                        {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                                    </p>
                                    <button 
                                        onClick={() => handleRemoveItem(item.product_id, item.name)}
                                        className="text-gray-400 hover:text-red-600 transition duration-150 mt-1"
                                    >
                                        <Trash2 size={18} /> Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cột 3: Tóm tắt & Thanh toán */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-fit sticky top-20">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-3">Tóm Tắt Giỏ Hàng</h2>
                        
                        <div className="flex justify-between text-lg font-medium mb-3">
                            <span>Tổng tiền hàng ({cartItems.length} sản phẩm):</span>
                            <span>{calculateTotal().toLocaleString('vi-VN')} ₫</span>
                        </div>
                        
                        <div className="flex justify-between text-lg font-medium text-green-600 border-b border-gray-200 pb-3 mb-4">
                            <span>Phí vận chuyển:</span>
                            <span>Miễn phí</span>
                        </div>
                        
                        <div className="flex justify-between text-2xl font-extrabold text-indigo-600 mb-6">
                            <span>Thành tiền:</span>
                            <span>{calculateTotal().toLocaleString('vi-VN')} ₫</span>
                        </div>

                        <button 
                            onClick={handleCheckout}
                            className="w-full flex items-center justify-center bg-indigo-600 text-white text-xl font-bold py-3 rounded-xl hover:bg-indigo-700 transition duration-300 shadow-lg"
                        >
                            TIẾN HÀNH THANH TOÁN
                        </button>
                    </div>
                </div>
            )}
            
            {/* MODAL CHỌN PHƯƠNG THỨC THANH TOÁN */}
            <Modal
                title={<span className="text-2xl font-bold text-indigo-700">Chọn Phương Thức Thanh Toán</span>}
                open={isCheckoutModalVisible}
                onCancel={() => setIsCheckoutModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setIsCheckoutModalVisible(false)}>
                        Quay lại
                    </Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        loading={isOrderCreating} 
                        onClick={handleCreateOrder}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isOrderCreating ? "Đang tạo đơn..." : "Xác nhận và Tạo Đơn hàng"}
                    </Button>,
                ]}
            >
                <Divider />
                <p className="mb-4 text-lg">Tổng thanh toán: <span className="text-xl font-extrabold text-red-600">{calculateTotal().toLocaleString('vi-VN')} ₫</span></p>
                
                <Radio.Group 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    value={paymentMethod}
                    className="w-full space-y-4"
                >
                    <Space direction="vertical" className="w-full">
                        <Radio value="cod" className="text-base font-medium">
                            Thanh toán khi nhận hàng (COD)
                        </Radio>
                        <Radio value="transfer" className="text-base font-medium">
                            Chuyển khoản ngân hàng
                        </Radio>
                    </Space>
                </Radio.Group>
                
                {/* Hiển thị QR Code nếu chọn Chuyển khoản */}
                {paymentMethod === 'transfer' && (
                    <div className="mt-6 p-4 border rounded-lg bg-gray-50 text-center">
                        <h4 className="font-bold text-indigo-600 mb-2">Thông tin Chuyển khoản</h4>
                        <p className="text-sm mb-3">Vui lòng quét mã QR hoặc chuyển khoản vào thông tin dưới đây để đơn hàng được xác nhận nhanh nhất.</p>
                        <img 
                            src={MOCK_QR_CODE_URL} 
                            alt="Mã QR Chuyển khoản" 
                            className="w-40 h-40 object-cover mx-auto border p-1 rounded-md"
                        />
                        <p className="mt-3 font-semibold">STK: 0123 4567 8901</p>
                        <p className="font-semibold">Ngân hàng: Ngân hàng XYZ</p>
                    </div>
                )}

            </Modal>
        </div>
    );
};

export default CartPage;