import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Minus, Plus, ChevronLeft, ChevronRight, Star, MessageSquare, Tags, Store } from 'lucide-react';
import { getProductById, getProductReviews, Product, ProductColorStock, ProductReview } from '@/api/productApi'; 
import { addToCart } from '@/api/cartApi'; 
import { message, Spin, Empty, Avatar } from 'antd';

interface ProductDetailPageProps {
    productId: string;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId }) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const isNoSizeLabel = (size?: string | null) => !size || ["Không size", "Khong size", "No size"].includes(size);

    const normalizeColorStock = (stock?: Record<string, any> | null): ProductColorStock => {
        if (!stock) return {};

        const hasNestedStock = Object.values(stock).some((value) => value && typeof value === 'object' && !Array.isArray(value));

        if (hasNestedStock) {
            return Object.entries(stock).reduce<ProductColorStock>((acc, [color, sizes]) => {
                if (sizes && typeof sizes === 'object' && !Array.isArray(sizes)) {
                    acc[color] = Object.entries(sizes).reduce<Record<string, number>>((sizeAcc, [size, qty]) => {
                        sizeAcc[size] = Number(qty) || 0;
                        return sizeAcc;
                    }, {});
                }
                return acc;
            }, {});
        }

        return {
            "Mac dinh": Object.entries(stock).reduce<Record<string, number>>((acc, [size, qty]) => {
                acc[size] = Number(qty) || 0;
                return acc;
            }, {}),
        };
    };

    const fetchData = useCallback(async () => {
        if (!productId) return; 
        try {
            setIsLoading(true);
            // Tải song song thông tin sản phẩm và đánh giá
            const [productData, reviewsData] = await Promise.all([
                getProductById(productId),
                getProductReviews(productId)
            ]);
            setProduct(productData);
            setReviews(reviewsData);

            const colorStock = normalizeColorStock(productData.size_details);
            const firstColor = Object.entries(colorStock).find(([, sizes]) =>
                Object.values(sizes).some((qty) => qty > 0)
            )?.[0] ?? null;
            const firstSize = firstColor
                ? Object.entries(colorStock[firstColor]).find(([, qty]) => qty > 0)?.[0] ?? null
                : null;

            setSelectedColor(firstColor);
            setSelectedSize(firstSize);
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            message.error("Không thể tải thông tin sản phẩm.");
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddToCart = async () => {
        if (!product) return;
        const colorStock = normalizeColorStock(product.size_details);
        const activeColor = selectedColor ?? Object.keys(colorStock)[0] ?? null;

        if (!activeColor) {
            message.warning("Sản phẩm hiện chưa có màu/size khả dụng.");
            return;
        }
        const sizeKey = selectedSize ?? Object.keys(colorStock[activeColor] || {})[0] ?? null;
        const cartSize = isNoSizeLabel(sizeKey) ? null : sizeKey;

        if (!sizeKey) {
            message.warning("Vui lòng chọn kích cỡ (Size) trước khi mua.");
            return;
        }

        const stock = colorStock[activeColor]?.[sizeKey] || 0;
        if (quantity > stock) {
            message.error(`${cartSize ? `Size ${cartSize}` : 'Sản phẩm'} chỉ còn ${stock} sản phẩm.`);
            return;
        }

        try {
            await addToCart(product.id, quantity, cartSize, activeColor === "Mac dinh" ? null : activeColor);
            message.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
        } catch (err: any) {
            const msg = err.response?.status === 401 ? "Vui lòng đăng nhập!" : "Lỗi thêm giỏ hàng.";
            message.error(msg);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" tip="Đang tải..." /></div>;
    if (!product) return <div className="p-20"><Empty description="Sản phẩm không tồn tại" /></div>;

    const currentImageUrl = product.images[currentImageIndex]?.url || product.thumbnail_url;
    const colorStock = normalizeColorStock(product.size_details);
    const colorOptions = Object.entries(colorStock).filter(([, sizes]) =>
        Object.values(sizes).some((qty) => qty > 0)
    );
    const selectedSizes = selectedColor ? colorStock[selectedColor] || {} : {};
    const hasSelectableSize = Object.keys(selectedSizes).some((size) => !isNoSizeLabel(size));
    const productInfoItems = [
        { label: "Thương hiệu", value: product.brand },
        { label: "Chất liệu", value: product.material },
        { label: "Xuất xứ", value: product.origin },
        { label: "Kiểu dáng", value: product.design_style },
        { label: "Phong cách", value: product.fashion_style },
        { label: "Màu sắc", value: product.colors?.join(", ") },
        { label: "Danh muc", value: product.categories?.map((category) => category.name).join(", ") },
    ].filter((item) => item.value);

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 font-sans">
            {/* PHẦN CHI TIẾT SẢN PHẨM */}
            <div className="bg-white shadow-2xl rounded-[32px] overflow-hidden p-6 lg:p-12 border border-gray-100">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    
                    {/* CỘT 1: GALLERY */}
                    <div className="space-y-6">
                        <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden bg-gray-50 border group shadow-inner">
                            <img src={currentImageUrl || ''} alt={product.name} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" />
                            {product.images.length > 1 && (
                                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setCurrentImageIndex(i => (i - 1 + product.images.length) % product.images.length)} className="bg-white/90 p-3 rounded-full shadow-xl hover:bg-white"><ChevronLeft size={24}/></button>
                                    <button onClick={() => setCurrentImageIndex(i => (i + 1) % product.images.length)} className="bg-white/90 p-3 rounded-full shadow-xl hover:bg-white"><ChevronRight size={24}/></button>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {product.images.map((img, idx) => (
                                <img key={idx} src={img.url} onClick={() => setCurrentImageIndex(idx)} 
                                    className={`w-24 h-24 object-cover rounded-2xl cursor-pointer border-2 transition-all ${currentImageIndex === idx ? 'border-indigo-600 scale-105 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`} />
                            ))}
                        </div>
                    </div>

                    {/* CỘT 2: INFO */}
                    <div className="flex flex-col justify-center">
                        <h1 className="text-5xl font-black text-gray-900 leading-tight mb-4">{product.name}</h1>
                        <div className="flex items-center gap-6 mb-8">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => <Star key={i} size={20} fill={i < 4 ? "currentColor" : "none"} />)}
                            </div>
                            <span className="text-gray-400 font-bold">({reviews.length} đánh giá) | Đã bán {product.sold}</span>
                        </div>

                        <div className="text-5xl font-black text-red-600 mb-6 tracking-tighter">
                            {product.price.toLocaleString('vi-VN')} ₫
                        </div>

                        {/* CHỌN SIZE */}
                        <div className="mb-8 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                                    <Store size={20} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cua hang</div>
                                    <div className="font-black text-gray-900">{product.shop?.name || product.shop_name || "Đang cập nhật"}</div>
                                    {product.shop?.address && (
                                        <div className="text-xs font-semibold text-gray-500">{product.shop.address}</div>
                                    )}
                                </div>
                            </div>

                            {productInfoItems.length > 0 && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {productInfoItems.map((item) => (
                                        <div key={item.label} className="rounded-2xl bg-white px-4 py-3">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</div>
                                            <div className="mt-1 text-sm font-bold text-gray-800">{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {product.description && (
                                <div className="mt-4 rounded-2xl bg-white px-4 py-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mô tả sản phẩm</div>
                                    <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-gray-600">{product.description}</p>
                                </div>
                            )}
                        </div>

                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-4 text-gray-800 font-black uppercase text-sm tracking-widest">
                                <Tags size={18} className="text-indigo-600"/> Chon mau:
                            </div>
                            <div className="flex flex-wrap gap-3 mb-8">
                                {colorOptions.map(([color, sizes]) => {
                                    const totalStock = Object.values(sizes).reduce((sum, qty) => sum + qty, 0);
                                    return (
                                        <button
                                            key={color}
                                            disabled={totalStock === 0}
                                            onClick={() => {
                                                setSelectedColor(color);
                                                setSelectedSize(Object.entries(sizes).find(([, qty]) => qty > 0)?.[0] ?? null);
                                                setQuantity(1);
                                            }}
                                            className={`px-5 py-3 rounded-2xl border-2 font-black transition-all
                                                ${totalStock === 0 ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' :
                                                selectedColor === color ? 'border-indigo-600 bg-indigo-600 text-white shadow-indigo-200 shadow-xl scale-105' : 'border-gray-100 text-gray-600 hover:border-indigo-400'}
                                            `}
                                        >
                                            {color}
                                            <div className={`text-[9px] font-bold mt-1 uppercase ${selectedColor === color ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                Con {totalStock}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {hasSelectableSize && <>
                            <div className="flex items-center gap-2 mb-4 text-gray-800 font-black uppercase text-sm tracking-widest">
                                <Tags size={18} className="text-indigo-600"/> Chọn kích cỡ:
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {Object.entries(selectedSizes).filter(([size]) => !isNoSizeLabel(size)).map(([size, qty]) => (
                                    <button
                                        key={size}
                                        disabled={qty === 0}
                                        onClick={() => {
                                            setSelectedSize(size);
                                            setQuantity(1);
                                        }}
                                        className={`min-w-[80px] px-4 py-3 rounded-2xl border-2 font-black transition-all relative
                                            ${qty === 0 ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : 
                                              selectedSize === size ? 'border-indigo-600 bg-indigo-600 text-white shadow-indigo-200 shadow-xl scale-105' : 'border-gray-100 text-gray-600 hover:border-indigo-400'}
                                        `}
                                    >
                                        {size}
                                        <div className={`text-[9px] font-bold mt-1 uppercase ${selectedSize === size ? 'text-indigo-100' : 'text-gray-400'}`}>
                                            {qty > 0 ? `Còn ${qty}` : 'Hết'}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* ẢNH HƯỚNG DẪN SIZE */}
                            <div className="mt-8 p-6 bg-indigo-50 rounded-[24px] border border-indigo-100">
                                <p className="text-xs font-black text-indigo-600 mb-4 uppercase tracking-[0.2em]">Bảng hướng dẫn thông số</p>
                                <img src="/size.jpg" alt="Size Chart" className="w-full h-auto rounded-xl shadow-md border-4 border-white" 
                                    onError={(e) => (e.currentTarget.style.display = 'none')} 
                                />
                            </div>
                            </>}
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-6 mb-6">
                            <div className="flex items-center bg-gray-50 rounded-2xl p-2 border border-gray-100">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-white rounded-xl transition text-gray-400 hover:text-indigo-600"><Minus size={20}/></button>
                                <input type="number" value={quantity} className="bg-transparent w-14 text-center font-black text-xl text-gray-800" readOnly />
                                <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-white rounded-xl transition text-gray-400 hover:text-indigo-600"><Plus size={20}/></button>
                            </div>
                            <button onClick={handleAddToCart} className="flex-1 bg-gray-900 text-white font-black py-5 rounded-[20px] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                                <ShoppingBag /> THÊM VÀO GIỎ HÀNG
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* PHẦN ĐÁNH GIÁ SẢN PHẨM */}
            <div className="mt-20 bg-white rounded-[32px] p-10 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white"><MessageSquare size={24} /></div>
                        <h2 className="text-3xl font-black text-gray-900">Phản hồi khách hàng</h2>
                    </div>
                </div>

                {reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-gray-50/50 p-8 rounded-[24px] border border-gray-100 relative transition-transform hover:-translate-y-1">
                                <div className="flex items-center gap-4 mb-6">
                                    <Avatar size={54} className="bg-indigo-100 text-indigo-600 font-black border-2 border-white shadow-sm">
                                        {review.user?.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <div>
                                        <h4 className="font-black text-gray-900 text-lg">{review.user?.name}</h4>
                                        <div className="flex text-yellow-400 gap-0.5">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />)}
                                        </div>
                                    </div>
                                    <span className="ml-auto text-[10px] font-black text-gray-300 uppercase tracking-tighter">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-gray-600 leading-relaxed font-medium italic">"{review.comment}"</p>
                                {review.image_url && (
                                    <div className="mt-6">
                                        <img src={review.image_url} className="w-full h-48 object-cover rounded-2xl border-4 border-white shadow-sm" alt="Review" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <Empty description={<span className="text-gray-400 font-bold">Chưa có đánh giá nào cho sản phẩm này.</span>} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailPage;
