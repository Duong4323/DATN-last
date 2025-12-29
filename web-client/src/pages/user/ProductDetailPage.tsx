import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, ChevronLeft, ChevronRight, Star, Shirt, UserCheck } from 'lucide-react';
// Import chính xác cho Product
import { getProductById, Product } from '@/api/productApi'; 
import { addToCart } from '@/api/cartApi'; 
// Import hàm Try-On mới
import { requestVirtualTryOn, TryOnResult } from '@/api/tryon'; 
// *** IMPORT API LẤY ẢNH USER ĐỂ ĐỒNG BỘ HÓA ***
import { getAuthenticatedUserProfileImage } from '@/api/users'; 
import { message, Modal, Button as AntdButton, Spin, Alert } from 'antd'; // Sử dụng Modal và Button Ant Design

// 1. ĐỊNH NGHĨA INTERFACE PROP MỚI (giữ nguyên)
interface ProductDetailPageProps {
    productId: string; // ID sản phẩm được truyền từ UserContainer
}

// ----------------------------------------------------
// --- HÀM UTILITY ĐƯA RA NGOÀI COMPONENT ---
// ----------------------------------------------------

// Hàm Giả lập URL to File/Blob (Cần cho FormData)
const urlToFile = async (url: string, filename: string): Promise<File | null> => {
    try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        const mimeType = blob.type; 
        return new File([blob], filename, { type: mimeType });
    } catch (e) {
        console.error("Failed to convert URL to File (CORS/Network error):", e);
        return null;
    }
};

// ----------------------------------------------------
// --- COMPONENT CHÍNH ---
// ----------------------------------------------------

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId }) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // --- State cho Try-On ---
    const [isTryOnModalVisible, setIsTryOnModalVisible] = useState(false);
    const [isTryOnLoading, setIsTryOnLoading] = useState(false);
    const [tryOnResult, setTryOnResult] = useState<TryOnResult | null>(null);
    
    // *** State để lưu URL ảnh Profile MỚI NHẤT ***
    const [currentUserImageUrl, setCurrentUserImageUrl] = useState<string | null>(null); 

    // --- Tải dữ liệu sản phẩm ---
    const fetchProduct = useCallback(async () => {
        if (!productId) return; 
        try {
            setIsLoading(true);
            const data = await getProductById(productId); 
            setProduct(data);
            if (data.images && data.images.length > 0) {
                 setCurrentImageIndex(0);
            }
        } catch (err) {
            console.error("Lỗi khi tải chi tiết sản phẩm:", err);
            message.error("Lỗi tải chi tiết sản phẩm. Vui lòng kiểm tra ID.");
        } finally {
            setIsLoading(false);
        }
    }, [productId]); 

    // *** useEffect QUAN TRỌNG: Đồng bộ hóa dữ liệu ***
    useEffect(() => {
        const syncData = async () => {
            // 1. Load dữ liệu sản phẩm
            await fetchProduct(); 

            // 2. Đồng bộ hóa ảnh profile từ API (Chỉ khi có token)
            if (localStorage.getItem('token')) {
                try {
                    const imageUrl = await getAuthenticatedUserProfileImage(); 
                    setCurrentUserImageUrl(imageUrl);
                } catch (error) {
                    // Nếu API lỗi (401), coi như chưa có ảnh/chưa đăng nhập
                    setCurrentUserImageUrl(null); 
                }
            } else {
                setCurrentUserImageUrl(null);
            }
        };

        syncData();
        
    }, [fetchProduct]); 

    // --- Xử lý Thử đồ ảo ---
   const handleTryOn = async () => {
  if (!currentUserImageUrl || !currentImageUrl) {
    message.error("Thiếu ảnh người dùng hoặc ảnh sản phẩm.");
    return;
  }

  setIsTryOnLoading(true);
  setTryOnResult(null);

  try {
    const result = await requestVirtualTryOn({
      person_image_url: currentUserImageUrl,
      cloth_image_url: currentImageUrl,
    });

    setTryOnResult(result);
    message.success("Thử đồ ảo thành công!");
  } catch (err: any) {
    message.error(
      err.response?.data?.message ||
      "Không thể thực hiện thử đồ ảo."
    );
  } finally {
    setIsTryOnLoading(false);
  }
};

    
    // --- Xử lý Thêm vào Giỏ hàng (giữ nguyên) ---
    const handleAddToCart = async () => {
        if (!product) return;
        
        if (product.remaining === 0 || quantity > product.remaining) {
            message.warning("Số lượng yêu cầu vượt quá tồn kho hiện tại.");
            return;
        }

        try {
            await addToCart(product.id, quantity);
            message.success(`Đã thêm ${quantity} x ${product.name} vào giỏ hàng!`);
        } catch (err: any) {
            const msg = err.response?.status === 401 ? "Vui lòng đăng nhập để thêm vào giỏ hàng." : "Thêm vào giỏ hàng thất bại.";
            message.error(msg);
            console.error(err);
        }
    };
    
    // --- Logic Image Slider (giữ nguyên) ---
    const handleImageChange = (index: number) => setCurrentImageIndex(index);
    const handleNextImage = () => { 
        if (!product || product.images.length === 0) return; 
        const total = product.images.length; 
        setCurrentImageIndex(prev => (prev + 1) % total); 
    };
    const handlePrevImage = () => { 
        if (!product || product.images.length === 0) return; 
        const total = product.images.length; 
        setCurrentImageIndex(prev => (prev - 1 + total) % total); 
    };

    if (isLoading) return <div className="text-center py-16 text-indigo-600">Đang tải chi tiết sản phẩm...</div>;
    if (!product) return <div className="text-center py-16 text-red-600">Sản phẩm không tồn tại.</div>;
    
    const currentImageUrl = product.images[currentImageIndex]?.url || product.thumbnail_url;
    const totalImages = product.images.length;

    return (
        <>
            <div className="bg-white shadow-xl rounded-xl p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    
                    {/* Cột 1: Image Slider */}
                    <div>
                        {/* Ảnh chính */}
                        <div className="relative h-[450px] border border-gray-200 rounded-lg overflow-hidden shadow-md mb-4 flex items-center justify-center bg-gray-100">
                            {currentImageUrl ? (
                                <img src={currentImageUrl} alt={product.name} className="object-contain w-full h-full" />
                            ) : (
                                <p className="text-gray-500">Không có ảnh</p>
                            )}
                            
                             {totalImages > 1 && (
                                <>
                                    <button onClick={handlePrevImage} className="absolute left-3 top-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full hover:bg-opacity-60 transition duration-200">
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button onClick={handleNextImage} className="absolute right-3 top-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full hover:bg-opacity-60 transition duration-200">
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                             <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                                {currentImageIndex + 1} / {totalImages}
                            </div>
                        </div>
                        
                        {/* Thumbs (Thumbnail nhỏ) */}
                        <div className="flex space-x-2 overflow-x-auto">
                            {product.images.map((img, index) => (
                                <img
                                    key={index}
                                    src={img.url}
                                    alt={`Thumbnail ${index + 1}`}
                                    onClick={() => handleImageChange(index)}
                                    className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${index === currentImageIndex ? 'border-indigo-600 shadow-md' : 'border-gray-300'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Cột 2: Thông tin & Giỏ hàng */}
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
                        
                        {/* Đánh giá */}
                        <div className="flex items-center text-xl text-yellow-500 mb-4">
                            <Star size={20} fill='yellow' className='mr-1'/>
                            <Star size={20} fill='yellow' className='mr-1'/>
                            <Star size={20} fill='yellow' className='mr-1'/>
                            <Star size={20} fill='yellow' className='mr-1'/>
                            <Star size={20} fill='gray' className='mr-2'/>
                            <span className='text-sm text-gray-500'>(128 đánh giá)</span>
                        </div>
                        
                        <p className="text-3xl font-extrabold text-red-600 mb-6">{product.price.toLocaleString('vi-VN')} ₫</p>
                        
                        <p className="text-gray-600 mb-6 whitespace-pre-line">{product.description || "Sản phẩm này hiện chưa có mô tả chi tiết."}</p>

                        {/* Quantity Selector */}
                        <div className="flex items-center space-x-4 mb-8">
                            <span className="text-lg font-medium text-gray-700">Số lượng:</span>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                                <button 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                                    disabled={quantity <= 1}
                                >
                                    <Minus size={18} />
                                </button>
                                <input 
                                    type="number" 
                                    value={quantity} 
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    className="w-16 text-center border-x py-2 text-lg focus:outline-none"
                                />
                                <button 
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                        
                        {/* HÀNG NÚT HÀNH ĐỘNG */}
                        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                            {/* Nút Thêm vào Giỏ hàng */}
                            <button
                                onClick={handleAddToCart}
                                disabled={product.remaining === 0}
                                className={`flex-1 flex items-center justify-center text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 
                                    ${product.remaining === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                <ShoppingBag size={24} className="mr-3" /> 
                                {product.remaining === 0 ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG'}
                            </button>
                            
                            {/* NÚT THỬ ĐỒ ẢO MỚI */}
                            <button
                                onClick={() => {
                                    if (!currentUserImageUrl) {
                                        message.warning("Vui lòng tải ảnh profile (trang cá nhân) để sử dụng tính năng thử đồ.");
                                        return;
                                    }
                                    setIsTryOnModalVisible(true);
                                }}
                                className={`flex-1 flex items-center justify-center text-lg font-bold py-3 px-8 border rounded-full shadow-lg transition duration-300
                                    ${!currentUserImageUrl 
                                        ? 'border-gray-400 text-gray-500 bg-gray-100 cursor-not-allowed' 
                                        : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                                    }`}
                                disabled={isTryOnLoading || !currentImageUrl || !currentUserImageUrl} // Disabled khi tải HOẶC thiếu ảnh
                            >
                                {isTryOnLoading ? (
                                    <Spin className="mr-3 text-indigo-600" />
                                ) : (
                                    <UserCheck size={24} className="mr-3" />
                                )}
                                THỬ ĐỒ ẢO
                            </button>
                        </div>
                        
                        {/* THÔNG BÁO QUAN TRỌNG VỀ ẢNH PROFILE */}
                        {!currentUserImageUrl && (
                             <Alert 
                                message="Tính năng Thử đồ bị vô hiệu hóa" 
                                description="Bạn cần phải đăng nhập và cập nhật ảnh profile (trang Thông tin cá nhân) để có thể thử đồ ảo."
                                type="warning" 
                                showIcon 
                                className="mt-4"
                             />
                        )}

                        {/* Chi tiết bổ sung */}
                        <div className="mt-8 pt-4 border-t border-gray-200 space-y-2">
                             <p className="text-sm text-gray-600">Còn lại: 
                                <span className={`font-bold ml-1 ${product.remaining > 10 ? 'text-green-600' : 'text-red-600'}`}>
                                    {product.remaining}
                                </span> sản phẩm
                             </p>
                             <p className="text-sm text-gray-600">Loại: {product.categories.map(c => c.name).join(', ')}</p>
                         </div>
                    </div>
                </div>
                {/* Thêm phần mô tả dài ở phía dưới */}
                <div className="mt-12 border-t pt-8">
                     <h2 className="text-2xl font-extrabold text-gray-800 mb-4">Chi tiết và Thông số</h2>
                     <div className="prose max-w-none text-gray-700">
                         <p>{product.description || "Đây là phần thông số kỹ thuật và chi tiết sản phẩm bổ sung. (Placeholder)"}</p>
                         <ul>
                             <li>Chất liệu: Cotton 100% cao cấp</li>
                             <li>Xuất xứ: Việt Nam</li>
                             <li>Chính sách bảo hành: Đổi trả trong 7 ngày</li>
                         </ul>
                     </div>
                 </div>
            </div>

            {/* MODAL HIỂN THỊ THỬ ĐỒ ẢO */}
            <Modal
                title="Thử Đồ Ảo (Virtual Try-On)"
                open={isTryOnModalVisible}
                onCancel={() => { setIsTryOnModalVisible(false); setTryOnResult(null); }}
                footer={[
                    <AntdButton 
                        key="close" 
                        onClick={() => { setIsTryOnModalVisible(false); setTryOnResult(null); }}
                    >
                        Đóng
                    </AntdButton>,
                    <AntdButton 
                        key="try" 
                        type="primary" 
                        loading={isTryOnLoading} 
                        onClick={handleTryOn}
                        disabled={!currentUserImageUrl || !currentImageUrl}
                    >
                        {isTryOnLoading ? 'Đang tạo ảnh...' : 'Thực hiện Try-On'}
                    </AntdButton>,
                ]}
                width={800}
                centered
            >
                <div className="p-4 text-center">
                    <p className="mb-4 text-gray-600">
                        Sử dụng ảnh profile của bạn và ảnh sản phẩm hiện tại để tạo ảnh thử đồ.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6 items-center">
                        <div>
                            <p className="font-bold mb-2">Ảnh người dùng</p>
                            <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-lg border">
                                {currentUserImageUrl ? (
                                    <img src={currentUserImageUrl} alt="Người dùng" className="object-contain max-h-full max-w-full rounded-lg" />
                                ) : (
                                    <p className="text-red-500 text-sm">Chưa có ảnh profile!</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="text-4xl text-indigo-600 font-bold">+</div>
                        
                        <div>
                            <p className="font-bold mb-2">Sản phẩm</p>
                            <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-lg border">
                                {currentImageUrl ? (
                                    <img src={currentImageUrl} alt="Sản phẩm" className="object-contain max-h-full max-w-full rounded-lg" />
                                ) : (
                                    <p className="text-red-500 text-sm">Sản phẩm không có ảnh.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {isTryOnLoading && (
                        <Alert 
                            message="Hệ thống đang xử lý và tạo ảnh thử đồ ảo. Quá trình này có thể mất 15-30 giây. Vui lòng đợi..." 
                            type="info" 
                            showIcon 
                            className="mt-4"
                        />
                    )}

                    {tryOnResult && tryOnResult.success && (
                        <div className="mt-6 p-4 border border-green-300 bg-green-50 rounded-lg">
                            <h4 className="font-bold text-lg text-green-700 mb-3">✅ Kết quả Thử đồ:</h4>
                            <div className="w-full h-auto max-h-96 flex justify-center items-center">
                                {/* Hiển thị ảnh Base64 kết quả */}
                                {tryOnResult.images.map((img, index) => (
  <img
    key={index}
    src={`data:image/png;base64,${img}`}
    alt={`Kết quả thử đồ ${index + 1}`}
    className="object-contain max-w-full max-h-96 rounded-lg shadow-xl"
  />
))}

                            </div>
                        </div>
                    )}
                    
                    {tryOnResult && !tryOnResult.success && (
                        <Alert 
                            message="Lỗi Try-On" 
                            description="Không thể tạo ảnh thử đồ ảo. Vui lòng thử lại với ảnh chất lượng cao hơn." 
                            type="error" 
                            showIcon 
                            className="mt-4"
                        />
                    )}
                </div>
            </Modal>
        </>
    );
};

export default ProductDetailPage;