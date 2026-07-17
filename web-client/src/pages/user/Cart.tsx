import React, { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeFromCart, CartItem } from '../../api/cartApi'; 
import { message, Modal, Radio, Divider, Button, Space, Spin, Tag, Empty } from 'antd'; 
import { createOrder, InsufficientStockItem, OrderPayload } from '../../api/orderApi';

interface CartPageProps {
    onOrderSuccess?: () => void;
}

const CartPage: React.FC<CartPageProps> = ({ onOrderSuccess }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [grandTotal, setGrandTotal] = useState<number>(0); 
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');
    const [isOrderCreating, setIsOrderCreating] = useState(false);
    
    const navigate = useNavigate();

    // --- Tải dữ liệu giỏ hàng ---
    const fetchCartData = async () => {
        try {
            setIsLoading(true);
            const data: any = await getCart(); 
            
            // Xử lý Object { items: [], grand_total: 0 } từ Laravel
            if (data && data.items) {
                setCartItems(data.items);
                setGrandTotal(data.grand_total || 0);
            } else {
                setCartItems([]);
                setGrandTotal(0);
            }
        } catch (err: any) {
            console.error("Cart Error:", err);
            if (err.response?.status === 401) {
                message.error("Vui lòng đăng nhập để xem giỏ hàng");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchCartData(); }, []);

    // --- Thay đổi số lượng theo ID + Size ---
    const handleQuantityChange = async (productId: number, size: string | null, color: string | null, newQuantity: number) => {
        if (newQuantity < 1) return;
        try {
            // Cập nhật UI tạm thời (Optimistic Update)
            setCartItems(prev => prev.map(item => 
                (item.product_id === productId && item.size === size && item.color === color) ? { ...item, quantity: newQuantity } : item
            ));
            
            await updateCartItem(productId, newQuantity, size, color); 
            fetchCartData(); // Reload để đồng bộ grand_total chính xác từ server
        } catch (err) {
            message.error("Lỗi cập nhật số lượng");
            fetchCartData(); 
        }
    };

    // --- Xóa sản phẩm theo ID + Size ---
    const handleRemoveItem = async (productId: number, size: string | null, color: string | null, name: string) => {
        const variantLabel = `${color ? `Mau: ${color}, ` : ''}${size ? `Size: ${size}` : 'Khong size'}`;
        if (!window.confirm(`Xóa ${name} (${variantLabel}) khỏi giỏ hàng?`)) return;
        try {
            await removeFromCart(productId, size, color); 
            message.success(`Đã xóa sản phẩm khỏi giỏ hàng`);
            fetchCartData(); 
        } catch (err) {
            message.error("Lỗi khi xóa sản phẩm");
        }
    };

    // --- Gửi đơn hàng ---
    const handleCreateOrder = async () => {
        setIsOrderCreating(true);
        try {
            const orderPayload: OrderPayload = {
                items: cartItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    product_name: item.name,
                    color: item.color,
                    size: item.size,
                })),
                total_amount: grandTotal,
                shipping_address: "Địa chỉ mặc định (Bạn nên cập nhật ở trang cá nhân)", 
                payment_method: paymentMethod,
                payment_status: 'unpaid',
            };

            const response = await createOrder(orderPayload);
            const orderCodes = response.orders?.map(order => order.orderId).join(', ') || response.orderId || '';
            message.success(orderCodes ? `Đơn hàng ${orderCodes} đã được tạo!` : 'Đơn hàng đã được tạo!');
            setCartItems([]);
            setGrandTotal(0);
            setIsCheckoutModalVisible(false);
            if (onOrderSuccess) {
                onOrderSuccess();
            } else {
                navigate('/');
            }
        } catch (err: any) {
            const insufficientItems = err.response?.data?.insufficient_items as InsufficientStockItem[] | undefined;

            if (err.response?.status === 422 && insufficientItems?.length) {
                Modal.warning({
                    title: "Một số sản phẩm không còn đủ số lượng",
                    width: 620,
                    content: (
                        <div className="mt-3 space-y-3">
                            <p className="text-sm text-gray-600">
                                Vui lòng điều chỉnh số lượng trong giỏ hàng theo tồn kho hiện tại:
                            </p>
                            <div className="space-y-2">
                                {insufficientItems.map((item) => {
                                    const variantLabel = [
                                        item.color ? `Màu: ${item.color}` : null,
                                        item.size ? `Size: ${item.size}` : "Không size",
                                    ].filter(Boolean).join(" - ");

                                    return (
                                        <div key={`${item.product_id}-${item.color ?? 'none'}-${item.size ?? 'none'}`} className="rounded-xl border border-red-100 bg-red-50 p-3">
                                            <div className="font-bold text-gray-900">{item.product_name}</div>
                                            <div className="mt-1 text-xs font-semibold text-gray-500">{variantLabel}</div>
                                            <div className="mt-2 text-sm text-red-600">
                                                Bạn muốn mua {item.requested_quantity}, hiện chỉ còn {item.remaining_quantity} sản phẩm.
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ),
                });
                fetchCartData();
                return;
            }

            message.error(err.response?.data?.message || "Tạo đơn hàng thất bại");
        } finally {
            setIsOrderCreating(false);
        }
    };

    if (isLoading) return <div className="h-screen flex justify-center items-center"><Spin size="large" tip="Đang tải giỏ hàng..." /></div>;

    return (
        <div className="max-w-6xl mx-auto py-12 px-4 min-h-screen font-sans">
            <h1 className="text-4xl font-black mb-10 italic flex items-center gap-4 text-gray-900">
                <ShoppingBag size={36} className="text-indigo-600" /> GIỎ HÀNG CỦA BẠN
            </h1>

            {cartItems.length === 0 ? (
                <div className="bg-white rounded-[40px] p-20 shadow-sm text-center border border-gray-100">
                    <Empty description={<span className="text-lg text-gray-400">Giỏ hàng của bạn đang trống.</span>} />
                    <Button type="primary" size="large" onClick={() => navigate('/')} className="mt-8 h-12 px-10 rounded-xl font-bold bg-indigo-600 border-none">
                        TIẾP TỤC MUA SẮM
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* DANH SÁCH MỤC HÀNG */}
                    <div className="lg:col-span-2 space-y-6">
                        {cartItems.map((item) => (
                            <div key={`${item.product_id}-${item.color || 'none'}-${item.size}`} className="flex items-center bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:border-indigo-200 transition-all group">
                                <img src={item.thumbnail_url || ''} className="w-28 h-28 object-cover rounded-3xl border border-gray-50 group-hover:scale-105 transition-transform" alt={item.name} />
                                
                                <div className="flex-grow ml-8">
                                    <h3 className="text-xl font-black text-gray-800">{item.name}</h3>
                                    {item.color && (
                                        <Tag color="blue" className="font-bold border-none px-4 py-1 rounded-lg mt-2 bg-blue-50 text-blue-600 uppercase text-[10px]">
                                            Mau: {item.color}
                                        </Tag>
                                    )}
                                    <Tag color="indigo" className="font-bold border-none px-4 py-1 rounded-lg mt-2 bg-indigo-50 text-indigo-600 uppercase text-[10px]">
                                        Kích cỡ: {item.size}
                                    </Tag>
                                    <p className="text-gray-400 font-bold text-sm mt-2">{item.price?.toLocaleString()} ₫</p>
                                </div>

                                <div className="flex items-center bg-gray-50 rounded-2xl p-1.5 border border-gray-100 mx-6">
                                    <button onClick={() => handleQuantityChange(item.product_id, item.size, item.color, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-indigo-600"><Minus size={16}/></button>
                                    <span className="w-10 text-center font-black">{item.quantity}</span>
                                    <button onClick={() => handleQuantityChange(item.product_id, item.size, item.color, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-indigo-600"><Plus size={16}/></button>
                                </div>

                                <div className="text-right min-w-[140px]">
                                    <p className="text-2xl font-black text-red-600 tracking-tighter">{(item.price * item.quantity).toLocaleString()} ₫</p>
                                    <button onClick={() => handleRemoveItem(item.product_id, item.size, item.color, item.name)} className="text-gray-300 hover:text-red-500 mt-2 text-[10px] font-black uppercase flex items-center gap-1 ml-auto">
                                        <Trash2 size={14}/> Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* TÓM TẮT THANH TOÁN */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-50 sticky top-24">
                            <h2 className="text-2xl font-black mb-8 uppercase tracking-widest border-b pb-4 text-gray-800">Tổng cộng</h2>
                            
                            <div className="space-y-4 mb-8 text-sm">
                                <div className="flex justify-between font-bold text-gray-400 uppercase text-[11px]">
                                    <span>Tạm tính</span>
                                    <span className="text-gray-700">{grandTotal.toLocaleString()} ₫</span>
                                </div>
                                <div className="flex justify-between font-bold text-green-500 uppercase text-[11px]">
                                    <span>Vận chuyển</span>
                                    <span>Miễn phí</span>
                                </div>
                                <Divider className="my-2" />
                                <div className="flex flex-col gap-1">
                                    <span className="font-black text-gray-800 text-lg uppercase tracking-tight">Thành tiền</span>
                                    <span className="text-4xl font-black text-red-600 tracking-tighter">{grandTotal.toLocaleString()} ₫</span>
                                </div>
                            </div>

                            <Button type="primary" block size="large" onClick={() => setIsCheckoutModalVisible(true)} 
                                className="h-16 rounded-2xl font-black bg-gray-900 border-none shadow-xl hover:scale-[1.02] transition-transform">
                                THANH TOÁN NGAY
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL THANH TOÁN */}
            <Modal 
                title={<span className="font-black text-xl uppercase italic">Hoàn tất đặt hàng</span>} 
                open={isCheckoutModalVisible} 
                onCancel={() => setIsCheckoutModalVisible(false)} 
                footer={null} 
                centered 
                width={500}
                className="custom-modal"
            >
                <div className="py-6 space-y-6">
                    <Radio.Group onChange={(e) => setPaymentMethod(e.target.value)} value={paymentMethod} className="w-full">
                        <Space direction="vertical" className="w-full gap-4">
                            <div className={`p-5 rounded-2xl border-2 transition-all ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100'}`}>
                                <Radio value="cod" className="font-black text-gray-700">THANH TOÁN KHI NHẬN HÀNG (COD)</Radio>
                            </div>
                            <div className={`p-5 rounded-2xl border-2 transition-all ${paymentMethod === 'transfer' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100'}`}>
                                <Radio value="transfer" className="font-black text-gray-700">CHUYỂN KHOẢN NGÂN HÀNG (ATM/QR)</Radio>
                            </div>
                        </Space>
                    </Radio.Group>
                    
                    {/* HIỂN THỊ QR.JPG KHI CHỌN CHUYỂN KHOẢN */}
                    {paymentMethod === 'transfer' && (
                        <div className="p-6 bg-gray-50 rounded-[32px] border border-dashed border-indigo-200 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <p className="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest">Quét mã QR để thanh toán</p>
                            <img 
                                src="/QR.jpg" 
                                alt="Payment QR" 
                                className="w-48 h-64 mx-auto border-4 border-white shadow-xl rounded-2xl mb-4 object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/200x300?text=QR+Coming+Soon";
                                }}
                            />
                        </div>
                    )}

                    <Button type="primary" block size="large" loading={isOrderCreating} onClick={handleCreateOrder}
                        className="h-14 rounded-xl font-black bg-indigo-600 border-none shadow-lg shadow-indigo-100">
                        XÁC NHẬN ĐẶT HÀNG
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default CartPage;
