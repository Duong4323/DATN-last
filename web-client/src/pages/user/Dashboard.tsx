import React, { useState } from "react";
import UserNavbar from "../../layouts/UserNavbar"; 
import UserFooter from "../../layouts/UserFooter"; 
import BestSellerProducts from "./productList"; 
import HeroSlider from "./HeroSlider"; 
import CartPage from "./Cart"; 
import ProductDetailPage from "../user/ProductDetailPage";
import UserProfile from "../user/UserProfile"; 
import UserOrderHistory from "../user/UserOrderHistory"; 

// Định nghĩa các view có thể hiển thị
type ContentView = 'home' | 'cart' | 'detail' | 'profile' | 'orders'; 

const UserContainer: React.FC = () => {
    // 1. STATE QUẢN LÝ
    // Quản lý danh mục (Để lọc sản phẩm ở trang chủ)
    const [activeCategory, setActiveCategory] = useState({ 
        key: 'home', 
        name: 'Trang chủ' 
    });
    
    // Quản lý giao diện đang hiển thị
    const [currentView, setCurrentView] = useState<ContentView>('home');
    
    // Lưu ID sản phẩm cho trang chi tiết
    const [detailProductId, setDetailProductId] = useState<number | null>(null);

    // 2. CÁC HÀM ĐIỀU HƯỚNG (LOGIC CHUYỂN VIEW)
    
    // Hàm reset trạng thái chung
    const resetToView = (view: ContentView, title: string) => {
        setCurrentView(view);
        setDetailProductId(null);
        window.scrollTo(0, 0); // Luôn cuộn lên đầu khi chuyển view
    };

    // Chuyển về trang chủ hoặc danh mục sản phẩm (Nam, Nữ, v.v.)
    const handleCategorySelect = (key: string, name: string) => {
        setCurrentView('home');
        setActiveCategory({ key, name });
        setDetailProductId(null);
        window.scrollTo(0, 0);
    };

    // Chuyển sang Giỏ hàng
    const handleCartClick = () => resetToView('cart', 'Giỏ hàng');

    // Chuyển sang Hồ sơ cá nhân
    const handleProfileClick = () => resetToView('profile', 'Hồ sơ');

    // Chuyển sang Lịch sử đơn hàng
    const handleOrdersClick = () => resetToView('orders', 'Đơn hàng');

    // Chuyển sang Chi tiết sản phẩm
    const handleViewDetail = (productId: number) => {
        setDetailProductId(productId);
        setCurrentView('detail');
        window.scrollTo(0, 0);
    };

    // 3. LOGIC RENDER NỘI DUNG CHÍNH
    const renderContent = () => {
        switch (currentView) {
            case 'cart':
                return <CartPage />;

            case 'detail':
                return detailProductId ? (
                    <ProductDetailPage productId={detailProductId.toString()} />
                ) : null;

            case 'profile':
                return <UserProfile />;

            case 'orders':
                return <UserOrderHistory />;

            case 'home':
            default:
                const isRealHomePage = activeCategory.key === 'home';
                return (
                    <div className="flex flex-col space-y-10">
                        {/* HeroSlider chỉ hiện khi ở Trang Chủ thực sự */}
                        {isRealHomePage && (
                            <HeroSlider onCategorySelect={handleCategorySelect} />
                        )}

                        {/* Danh sách sản phẩm tự động lọc theo categoryKey */}
                        <div className="pt-4">
                            <BestSellerProducts 
                                categoryKey={activeCategory.key} 
                                categoryName={activeCategory.name}
                                onViewDetail={handleViewDetail}
                            />
                        </div>
                    </div>
                );
        }
    };

    // 4. GIAO DIỆN TỔNG THỂ (LAYOUT)
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Thanh điều hướng cố định */}
            <UserNavbar 
                activeKey={activeCategory.key} 
                onCategorySelect={handleCategorySelect}
                onCartClick={handleCartClick}
                onProfileClick={handleProfileClick} 
                onOrdersClick={handleOrdersClick}
            />

            {/* Nội dung thay đổi động */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
                {/* Bọc nội dung trong hiệu ứng fade-in đơn giản bằng CSS nếu muốn */}
                <div className="animate-in fade-in duration-500">
                    {renderContent()}
                </div>
            </main>

            {/* Chân trang */}
            <UserFooter />
        </div>
    );
};

export default UserContainer;