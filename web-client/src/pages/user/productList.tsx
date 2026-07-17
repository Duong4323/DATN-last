import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { message } from "antd";
import { ArrowRight, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import { addToCart } from "../../api/cartApi";
import { getProducts, Product } from "../../api/productApi";

interface ProductListProps {
    categoryKey: string;
    categoryName: string;
    onViewDetail: (productId: number) => void;
    searchQuery?: string;
}

const BestSellerProducts: React.FC<ProductListProps> = ({
    categoryKey,
    categoryName,
    onViewDetail,
    searchQuery = "",
}) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const isHomepage = categoryKey === "home" && !searchQuery;

    useEffect(() => {
        const fetchProductsByFilter = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getProducts(categoryKey, searchQuery);
                setProducts(data);
            } catch (err) {
                console.error("Lỗi khi tải sản phẩm:", err);
                setError("Không thể tải sản phẩm. Vui lòng thử lại sau.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductsByFilter();
    }, [categoryKey, searchQuery]);

    const getTitle = () => {
        if (searchQuery) return `KẾT QUẢ TÌM KIẾM: "${searchQuery.toUpperCase()}"`;
        return categoryKey === "all" ? "TẤT CẢ SẢN PHẨM" : `SẢN PHẨM: ${categoryName.toUpperCase()}`;
    };

    const getNewestTime = (product: Product) => {
        const createdTime = product.created_at ? new Date(product.created_at).getTime() : 0;
        return Number.isFinite(createdTime) && createdTime > 0 ? createdTime : product.id;
    };

    const bestSellerProducts = [...products]
        .sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
        .slice(0, 8);

    const newestProducts = [...products]
        .sort((a, b) => getNewestTime(b) - getNewestTime(a))
        .slice(0, 8);

    const handleQuickAddToCart = async (
        event: React.MouseEvent<HTMLButtonElement>,
        productId: number,
        productName: string,
        sizeDetails: Record<string, number | Record<string, number>>
    ) => {
        event.preventDefault();
        event.stopPropagation();

        let firstAvailableColor: string | null = null;
        let firstAvailableSize: string | null = null;

        for (const [colorOrSize, value] of Object.entries(sizeDetails || {})) {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                const sizeEntry = Object.entries(value).find(([, qty]) => Number(qty) > 0);
                if (sizeEntry) {
                    firstAvailableColor = colorOrSize;
                    firstAvailableSize = ["Không size", "Khong size", "No size"].includes(sizeEntry[0]) ? null : sizeEntry[0];
                    break;
                }
            } else if (Number(value) > 0) {
                firstAvailableSize = ["Không size", "Khong size", "No size"].includes(colorOrSize) ? null : colorOrSize;
                break;
            }
        }

        const hasStock = Object.values(sizeDetails || {}).some((value) => {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                return Object.values(value).some((qty) => Number(qty) > 0);
            }
            return Number(value) > 0;
        });

        if (!hasStock) {
            message.warning("Sản phẩm hiện đã hết hàng.");
            return;
        }

        try {
            await addToCart(productId, 1, firstAvailableSize, firstAvailableColor);
            message.success(`Đã thêm ${productName} vào giỏ hàng!`);
        } catch (err: any) {
            const msg = err.response?.status === 401 ? "Vui lòng đăng nhập." : "Thêm giỏ hàng thất bại.";
            message.error(msg);
        }
    };

    const ProductCard: React.FC<Product> = ({ id, name, price, thumbnail_url, sold, size_details }) => (
        <div
            onClick={() => onViewDetail(id)}
            className="block bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition duration-300 overflow-hidden group cursor-pointer"
        >
            <div className="relative overflow-hidden">
                <img
                    src={thumbnail_url || "https://placehold.co/400x400/CCCCCC/000000?text=NO+IMAGE"}
                    alt={name}
                    className="w-full h-72 object-cover transition-opacity duration-300 group-hover:opacity-90"
                />
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate">{name}</h3>
                <p className="text-xl font-extrabold text-indigo-600 mt-1">{price.toLocaleString("vi-VN")} VND</p>
                <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Đã bán: {sold}</span>
                    <button
                        onClick={(event) => handleQuickAddToCart(event, id, name, size_details)}
                        className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition duration-200"
                        aria-label={`Thêm ${name} vào giỏ hàng`}
                    >
                        <ShoppingBag size={20} />
                    </button>
                </div>
            </div>
        </div>
    );

    const EmptyProducts = () => (
        <div className="col-span-full p-20 text-center text-gray-500 border-2 border-dashed rounded-xl bg-white">
            <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Không tìm thấy sản phẩm nào phù hợp với yêu cầu.</p>
        </div>
    );

    const ProductSection = ({
        title,
        icon,
        items,
        showViewAll = false,
    }: {
        title: string;
        icon: React.ReactNode;
        items: Product[];
        showViewAll?: boolean;
    }) => (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center">
                    {icon}
                    {title}
                </h2>
                {showViewAll && (
                    <Link to="/products" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                        Xem tất cả <ArrowRight size={18} className="ml-1" />
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {items.length > 0 ? (
                    items.map((product) => <ProductCard key={product.id} {...product} />)
                ) : (
                    <EmptyProducts />
                )}
            </div>
        </section>
    );

    if (isLoading) {
        return <div className="text-center py-10 text-indigo-600 font-medium">Đang tải sản phẩm...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    if (isHomepage) {
        return (
            <div className="space-y-12">
                <ProductSection
                    title="Sản phẩm bán chạy"
                    icon={<TrendingUp size={30} className="mr-2 text-red-500" />}
                    items={bestSellerProducts}
                    showViewAll
                />
                <ProductSection
                    title="Sản phẩm mới"
                    icon={<Sparkles size={30} className="mr-2 text-indigo-500" />}
                    items={newestProducts}
                />
            </div>
        );
    }

    return (
        <ProductSection
            title={getTitle()}
            icon={<TrendingUp size={30} className="mr-2 text-red-500" />}
            items={products}
        />
    );
};

export default BestSellerProducts;
