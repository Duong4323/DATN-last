import React, { useState, useEffect } from 'react';
// ĐÃ SỬA LỖI: Chuyển về đường dẫn tương đối (giả định file api nằm ở ../api)
import { getProducts, Product } from "../../api/productApi"; 
import { ShoppingBag, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addToCart } from "../../api/cartApi"; // Import API Giỏ hàng
import { message } from 'antd'; // Import thông báo

interface ProductListProps {
    categoryKey: string; 
    categoryName: string; 
    onViewDetail: (productId: number) => void; // <<< THÊM PROP XEM CHI TIẾT
}

const BestSellerProducts: React.FC<ProductListProps> = ({ categoryKey, categoryName, onViewDetail }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const IS_HOMEPAGE = categoryKey === 'home';

    useEffect(() => {
        const fetchProductsByFilter = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const data = await getProducts(categoryKey); 
                
                let filteredData = data;
                
                if (IS_HOMEPAGE) {
                    filteredData = data.slice(0, 8); 
                } 
                
                setProducts(filteredData);
                
            } catch (err) {
                console.error(`Lỗi khi tải sản phẩm cho ${categoryName}:`, err);
                setError(`Không thể tải sản phẩm cho danh mục ${categoryName}.`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductsByFilter();
    }, [categoryKey, categoryName, onViewDetail]); // Thêm onViewDetail vào dependency array để tránh warning
    
    // --- Hàm xử lý Thêm Nhanh vào Giỏ hàng ---
    const handleQuickAddToCart = async (e: React.MouseEvent<HTMLButtonElement>, productId: number, productName: string) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        
        try {
            await addToCart(productId, 1); 
            message.success(`Đã thêm 1 x ${productName} vào giỏ hàng!`);
        } catch (err: any) {
            console.error("Quick Add Error:", err);
            const msg = err.response?.status === 401 ? "Vui lòng đăng nhập để thêm vào giỏ hàng." : "Thêm vào giỏ hàng thất bại.";
            message.error(msg);
        }
    };

    if (isLoading) {
        return <div className="text-center py-8 text-indigo-600">Đang tải sản phẩm {categoryName}...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-600">Lỗi: {error}</div>;
    }

    const title = IS_HOMEPAGE ? "SẢN PHẨM BÁN CHẠY NHẤT" : `SẢN PHẨM: ${categoryName.toUpperCase()}`;

    // Component hiển thị thẻ sản phẩm (ĐÃ THAY THẺ LINK BẰNG DIV VÀ GỌI onViewDetail)
    const ProductCard: React.FC<Product> = ({ id, name, price, thumbnail_url, sold }) => (
        <div 
            onClick={() => onViewDetail(id)} // <<< GỌI HÀM VIEW DETAIL TỪ CONTAINER
            className="block bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition duration-300 overflow-hidden group cursor-pointer"
        >
            
            {/* PHẦN HIỂN THỊ ẢNH THUMBNAIL */}
            <div className="relative overflow-hidden">
                <img 
                    src={thumbnail_url || 'https://placehold.co/400x400/CCCCCC/000000?text=NO+IMAGE'} 
                    alt={name} 
                    className="w-full h-72 object-cover transition-opacity duration-300 group-hover:opacity-90"
                />
            </div>
            
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate">{name}</h3>
                <p className="text-xl font-extrabold text-indigo-600 mt-1">{price.toLocaleString('vi-VN')} ₫</p>
                <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Đã bán: **{sold}**</span>
                    {/* NÚT THÊM NHANH VÀO GIỎ HÀNG */}
                    <button 
                        onClick={(e) => handleQuickAddToCart(e, id, name)}
                        className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition duration-200"
                        title="Thêm vào giỏ hàng"
                    >
                        <ShoppingBag size={20} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900 flex items-center">
                    <TrendingUp size={30} className="mr-2 text-red-500" />
                    {title}
                </h2>
                {/* Chỉ hiển thị nút "Xem tất cả" khi đang ở Trang Chủ (IS_HOMEPAGE) */}
                {IS_HOMEPAGE && (
                     <Link to="/products/trending" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                        Xem tất cả <ArrowRight size={18} className="ml-1" />
                    </Link>
                )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.length > 0 ? (
                    products.map(product => (
                        <ProductCard key={product.id} {...product} />
                    ))
                ) : (
                    <div className="col-span-4 p-10 text-center text-gray-500 border rounded-lg bg-white">
                        Không tìm thấy sản phẩm nào trong danh mục này.
                    </div>
                )}
            </div>
        </section>
    );
};

export default BestSellerProducts;