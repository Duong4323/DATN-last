import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, User, Search, Menu, X, Heart, LogOut, Settings, Package } from 'lucide-react'; // 💡 Import icon Package
import { Link, useNavigate } from 'react-router-dom';

// Dữ liệu thanh điều hướng
const NAV_LINKS = [
    { name: 'Trang chủ', key: 'home', current: true },
    { name: 'Nam', key: 'donam', current: false }, 
    { name: 'Nữ', key: 'donu', current: false }, 
    { name: 'Đồ thể thao', key: 'dothethao', current: false }, 
    { name: 'Đồ công sở', key: 'docongso', current: false }, 
    { name: 'Đồ lót', key: 'dolot', current: false }, 
];

interface UserNavbarProps {
    onCategorySelect: (key: string, name: string) => void;
    activeKey: string; 
    onCartClick: () => void;
    onProfileClick: () => void; 
    onOrdersClick: () => void; // 💡 ĐÃ THÊM PROP XỬ LÝ CHUYỂN VIEW ĐƠN HÀNG
}

const UserNavbar: React.FC<UserNavbarProps> = ({ onCategorySelect, activeKey, onCartClick, onProfileClick, onOrdersClick }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const navigate = useNavigate();
    
    const dropdownRef = useRef<HTMLDivElement>(null); 
    
    const isAuthenticated = true; 
    const userName = "Nguyễn Văn A";

    // --- Logic Click Outside (Giữ nguyên) ---
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []); 
    // -----------------------------------------------------------

    // Hàm xử lý khi chọn danh mục hoặc Trang chủ
    const handleMainClick = (key: string, name: string) => {
        onCategorySelect(key, name); 
        setIsMobileMenuOpen(false); 
    };
    
    // Hàm xử lý cho Icon Search
    const handleSearchClick = () => {
        alert("Chức năng Tìm kiếm được kích hoạt!");
    };
    
    // Hàm xử lý Đăng xuất
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login'); // Chuyển hướng bằng React Router
        alert("Bạn đã đăng xuất.");
        setIsUserDropdownOpen(false);
    };

    const UserDropdown = () => (
        <div 
            className="absolute right-0 mt-3 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-20"
            ref={dropdownRef}
        >
            {isAuthenticated && (
                <div className="px-4 py-2 text-sm text-gray-500 border-b mb-1 truncate">
                    Xin chào, **{userName}**
                </div>
            )}
            
            {/* 💡 Nút Đơn hàng của tôi (Desktop) */}
            <button 
                onClick={() => {
                    onOrdersClick(); // Kích hoạt chuyển view Đơn hàng
                    setIsUserDropdownOpen(false);
                }}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
            >
                <Package size={18} className="mr-2" /> Đơn hàng của tôi
            </button>
            
            {/* Nút Hồ sơ người dùng */}
            <button 
                onClick={() => {
                    onProfileClick(); // Kích hoạt chuyển view Hồ sơ
                    setIsUserDropdownOpen(false);
                }}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
            >
                <Settings size={18} className="mr-2" /> Hồ sơ người dùng
            </button>
            
            {/* Nút Đăng xuất */}
            <button 
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            >
                <LogOut size={18} className="mr-2" /> Đăng xuất
            </button>
        </div>
    );

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    
                    {/* Logo */}
                    <div className="flex items-center">
                        <button onClick={() => handleMainClick('home', 'Trang chủ')} 
                                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition duration-150 focus:outline-none">
                            <span className="text-3xl font-extrabold tracking-tight">SHOP</span>
                        </button>
                    </div>

                    {/* Thanh menu chính (Desktop) */}
                    <div className="hidden lg:flex lg:items-center lg:space-x-4">
                        {NAV_LINKS.map((item) => (
                            <div key={item.key}>
                                <button
                                    onClick={() => handleMainClick(item.key, item.name)}
                                    className={`inline-flex items-center px-3 py-2 text-sm font-medium transition duration-150 rounded-md focus:outline-none
                                        ${activeKey === item.key 
                                            ? 'bg-indigo-50 text-indigo-700' 
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'}`}
                                >
                                    {item.name}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Icons chức năng (Search, Cart, User) */}
                    <div className="flex items-center space-x-4">
                        
                        {/* ICON TÌM KIẾM */}
                        <button 
                            onClick={handleSearchClick}
                            className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition duration-150"
                        >
                            <Search className="h-6 w-6" />
                        </button>
                        
                        {/* ICON YÊU THÍCH */}
                        <button className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition duration-150">
                            <Heart className="h-6 w-6" />
                        </button>
                        
                        {/* ICON GIỎ HÀNG (Sử dụng onCartClick) */}
                        <button 
                            onClick={onCartClick} // GỌI PROP ĐỂ CHUYỂN VIEW NỘI BỘ
                            className="relative p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition duration-150"
                        >
                            <ShoppingCart className="h-6 w-6" />
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full"></span>
                        </button>
                        
                        {/* ICON NGƯỜI DÙNG CÓ DROPDOWN */}
                        <div className="relative hidden sm:block"> 
                            <button 
                                onClick={() => setIsUserDropdownOpen(prev => !prev)}
                                className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition duration-150 focus:outline-none"
                            >
                                <User className="h-6 w-6" />
                            </button>
                            
                            {/* Hiển thị Dropdown và gắn ref */}
                            {isUserDropdownOpen && isAuthenticated && <UserDropdown />}
                            
                            {/* Nếu chưa đăng nhập */}
                            {!isAuthenticated && (
                                <Link to="/login" className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition duration-150 focus:outline-none">
                                    <User className="h-6 w-6" />
                                </Link>
                            )}
                        </div>
                        
                        {/* Nút Mobile Menu */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition duration-150 focus:outline-none"
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden border-t">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {NAV_LINKS.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => handleMainClick(item.key, item.name)}
                                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition duration-150 focus:outline-none
                                    ${activeKey === item.key 
                                        ? 'bg-indigo-50 text-indigo-700' 
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'}`}
                            >
                                {item.name}
                            </button>
                        ))}
                        {/* Thêm các icons chức năng vào menu mobile */}
                        <div className="pt-2 border-t mt-2 flex flex-col space-y-2">
                            {isAuthenticated ? (
                                <>
                                    {/* 💡 Nút Đơn hàng của tôi (Mobile) */}
                                    <button 
                                        onClick={() => {
                                            onOrdersClick(); // Kích hoạt chuyển view Đơn hàng
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="text-gray-700 hover:text-indigo-600 flex items-center px-3 py-1 text-sm w-full text-left"
                                    >
                                        <Package size={18} className="mr-2"/> Đơn hàng của tôi
                                    </button>
                                    
                                    {/* Nút Hồ sơ người dùng (Mobile) */}
                                    <button 
                                        onClick={() => {
                                            onProfileClick(); 
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="text-gray-700 hover:text-indigo-600 flex items-center px-3 py-1 text-sm w-full text-left"
                                    >
                                        <Settings size={18} className="mr-2"/> Hồ sơ người dùng
                                    </button>
                                    
                                    <button onClick={handleLogout} className="text-gray-700 hover:text-red-600 flex items-center px-3 py-1 text-sm w-full text-left"><LogOut size={18} className="mr-2"/> Đăng xuất</button>
                                </>
                            ) : (
                                <Link to="/login" className="text-gray-700 hover:text-indigo-600 flex items-center px-3 py-1 text-sm"><User size={18} className="mr-2"/> Đăng nhập</Link>
                            )}
                            {/* Mobile Cart Button (Sử dụng onCartClick) */}
                            <button onClick={onCartClick} className="text-gray-700 hover:text-indigo-600 flex items-center px-3 py-1 text-sm w-full text-left"><ShoppingCart size={18} className="mr-2"/> Giỏ hàng</button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default UserNavbar;