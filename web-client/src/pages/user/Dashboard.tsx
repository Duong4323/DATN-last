import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserNavbar from "../../layouts/UserNavbar";
import UserFooter from "../../layouts/UserFooter";
import BestSellerProducts from "./productList";
import HeroSlider from "./HeroSlider";
import CartPage from "./Cart";
import ProductDetailPage from "../user/ProductDetailPage";
import UserProfile from "../user/UserProfile";
import UserOrderHistory from "../user/UserOrderHistory";

type ContentView = "home" | "cart" | "detail" | "profile" | "orders";

const UserContainer: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isLoggedIn = !!localStorage.getItem("token");

    const [activeCategory, setActiveCategory] = useState({ key: "home", name: "Trang chủ" });
    const [currentView, setCurrentView] = useState<ContentView>("home");
    const [detailProductId, setDetailProductId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const productId = new URLSearchParams(location.search).get("productId");

        if (!productId) {
            if (location.pathname === "/products") {
                setCurrentView("home");
                setActiveCategory({ key: "all", name: "Tất cả sản phẩm" });
                setDetailProductId(null);
                window.scrollTo(0, 0);
            } else if (location.pathname === "/") {
                setActiveCategory((current) =>
                    current.key === "all" ? { key: "home", name: "Trang chủ" } : current
                );
            }

            return;
        }

        const parsedProductId = Number(productId);
        if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) return;

        setDetailProductId(parsedProductId);
        setCurrentView("detail");
        window.scrollTo(0, 0);
    }, [location.pathname, location.search]);

    const clearProductLink = () => {
        if (location.search) {
            navigate("/", { replace: true });
        }
    };

    const resetToView = (view: ContentView) => {
        if (!isLoggedIn && (view === "profile" || view === "orders")) {
            navigate("/login");
            return;
        }

        setCurrentView(view);
        setDetailProductId(null);
        setSearchQuery("");
        clearProductLink();
        window.scrollTo(0, 0);
    };

    const handleCategorySelect = (key: string, name: string) => {
        setCurrentView("home");
        setActiveCategory({ key, name });
        setSearchQuery("");
        setDetailProductId(null);
        if (location.pathname !== "/") {
            navigate("/", { replace: true });
        }
        clearProductLink();
        window.scrollTo(0, 0);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setDetailProductId(null);
        clearProductLink();

        if (currentView !== "home") {
            setCurrentView("home");
        }
    };

    const handleViewDetail = (productId: number) => {
        setDetailProductId(productId);
        setCurrentView("detail");
        navigate(`/?productId=${productId}`);
        window.scrollTo(0, 0);
    };

    const handleOrderSuccess = () => {
        setCurrentView("home");
        setActiveCategory({ key: "home", name: "Trang chủ" });
        setSearchQuery("");
        setDetailProductId(null);
        navigate("/", { replace: true });
        window.scrollTo(0, 0);
    };

    const renderContent = () => {
        switch (currentView) {
            case "cart":
                return <CartPage onOrderSuccess={handleOrderSuccess} />;
            case "profile":
                return <UserProfile />;
            case "orders":
                return <UserOrderHistory />;
            case "detail":
                return detailProductId ? <ProductDetailPage productId={detailProductId.toString()} /> : null;
            case "home":
            default:
                const isRealHomePage = activeCategory.key === "home" && searchQuery === "";
                return (
                    <div className="flex flex-col space-y-10">
                        {isRealHomePage && <HeroSlider onCategorySelect={handleCategorySelect} />}
                        <div className="pt-4">
                            <BestSellerProducts
                                categoryKey={activeCategory.key}
                                categoryName={activeCategory.name}
                                searchQuery={searchQuery}
                                onViewDetail={handleViewDetail}
                            />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <UserNavbar
                activeKey={activeCategory.key}
                onCategorySelect={handleCategorySelect}
                onCartClick={() => resetToView("cart")}
                onProfileClick={() => resetToView("profile")}
                onOrdersClick={() => resetToView("orders")}
                onSearch={handleSearch}
            />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
                <div className="animate-in fade-in duration-500">{renderContent()}</div>
            </main>

            <UserFooter />
        </div>
    );
};

export default UserContainer;
