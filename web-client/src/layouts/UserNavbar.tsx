import React, { useEffect, useRef, useState } from 'react';
import { Heart, LogIn, LogOut, Menu, Package, Search, Settings, ShoppingCart, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '@/api/productApi';

const FALLBACK_NAV_LINKS = [
    { name: 'Trang chủ', key: 'home' },
    { name: 'Áo', key: 'ao' },
    { name: 'Đồ thể thao', key: 'dothethao' },
    { name: 'Đồ ngủ', key: 'dongu' },
    { name: 'Váy/Đầm', key: 'vaydam' },
    { name: 'Giày dép', key: 'giaydep' },
    { name: 'Phụ kiện', key: 'phukien' },
];

const CATEGORY_MENU_RULES = [
    { name: 'Áo', fallbackKey: 'ao', aliases: ['ao'] },
    { name: 'Đồ thể thao', fallbackKey: 'dothethao', aliases: ['do the thao', 'dothethao'] },
    { name: 'Đồ ngủ', fallbackKey: 'dongu', aliases: ['do ngu', 'dongu'] },
    { name: 'Váy/Đầm', fallbackKey: 'vaydam', aliases: ['vay dam', 'vaydam', 'vay', 'dam'] },
    { name: 'Giày dép', fallbackKey: 'giaydep', aliases: ['giay dep', 'giaydep', 'giay'] },
    { name: 'Phụ kiện', fallbackKey: 'phukien', aliases: ['phu kien', 'phukien'] },
];

const normalizeMenuText = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '');

interface UserNavbarProps {
    onCategorySelect: (key: string, name: string) => void;
    activeKey: string;
    onCartClick: () => void;
    onProfileClick: () => void;
    onOrdersClick: () => void;
    onSearch: (query: string) => void;
}

const UserNavbar: React.FC<UserNavbarProps> = ({
    onCategorySelect,
    activeKey,
    onCartClick,
    onProfileClick,
    onOrdersClick,
    onSearch,
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [navLinks, setNavLinks] = useState(FALLBACK_NAV_LINKS);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isAuthenticated = !!localStorage.getItem('token');
    const userStorage = localStorage.getItem('user');
    const userData = userStorage ? JSON.parse(userStorage) : null;
    const userName = userData?.name || 'Người dùng';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        getCategories()
            .then((categories) => {
                if (categories.length === 0) return;

                const visibleCategoryLinks = CATEGORY_MENU_RULES.map((rule) => {
                    const matchedCategory = categories.find((category) => {
                        const values = [category.name, category.slug || ''].map(normalizeMenuText);

                        return rule.aliases
                            .map(normalizeMenuText)
                            .some((alias) => values.includes(alias));
                    });

                    return {
                        name: rule.name,
                        key: matchedCategory?.slug || (matchedCategory ? String(matchedCategory.id) : rule.fallbackKey),
                    };
                });

                setNavLinks([FALLBACK_NAV_LINKS[0], ...visibleCategoryLinks]);
            })
            .catch(() => setNavLinks(FALLBACK_NAV_LINKS));
    }, []);

    const handleMainClick = (key: string, name: string) => {
        onCategorySelect(key, name);
        setSearchTerm('');
        setIsMobileMenuOpen(false);
    };

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSearch(searchTerm);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsUserDropdownOpen(false);
        navigate('/');
    };

    const UserDropdown = () => (
        <div
            ref={dropdownRef}
            className="absolute right-0 z-20 mt-3 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
        >
            <div className="mb-1 truncate border-b px-4 py-2 text-sm font-medium text-gray-500">
                Xin chào, {userName}
            </div>
            <button
                onClick={() => {
                    onOrdersClick();
                    setIsUserDropdownOpen(false);
                }}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            >
                <Package size={18} className="mr-2" /> Đơn hàng của tôi
            </button>
            <button
                onClick={() => {
                    onProfileClick();
                    setIsUserDropdownOpen(false);
                }}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            >
                <Settings size={18} className="mr-2" /> Hồ sơ người dùng
            </button>
            <button
                onClick={handleLogout}
                className="mt-1 flex w-full items-center border-t px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
            >
                <LogOut size={18} className="mr-2" /> Đăng xuất
            </button>
        </div>
    );

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex flex-shrink-0 items-center">
                        <button
                            onClick={() => handleMainClick('home', 'Trang chủ')}
                            className="text-indigo-600 transition duration-150 hover:text-indigo-800 focus:outline-none"
                        >
                            <span className="text-2xl font-extrabold tracking-tight sm:text-3xl">SHOP</span>
                        </button>
                    </div>

                    <div className="hidden items-center space-x-1 lg:flex">
                        {navLinks.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => handleMainClick(item.key, item.name)}
                                className={`rounded-md px-3 py-2 text-sm font-medium transition duration-150 focus:outline-none ${
                                    activeKey === item.key
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                                }`}
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>

                    <div className="mx-4 hidden max-w-xs flex-1 md:flex">
                        <form onSubmit={handleSearchSubmit} className="relative w-full">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Tìm sản phẩm..."
                                className="w-full rounded-full border-transparent bg-gray-100 py-1.5 pl-4 pr-10 text-sm transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-indigo-600"
                            >
                                <Search size={18} />
                            </button>
                        </form>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                        <button
                            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 md:hidden"
                            aria-label="Tìm kiếm"
                        >
                            <Search size={22} />
                        </button>

                        <button
                            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600"
                            aria-label="Yêu thích"
                        >
                            <Heart className="h-6 w-6" />
                        </button>

                        <div className="relative hidden items-center gap-2 sm:flex">
                            {isAuthenticated ? (
                                <>
                                    <button
                                        onClick={onCartClick}
                                        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600"
                                        aria-label="Giỏ hàng"
                                    >
                                        <ShoppingCart className="h-6 w-6" />
                                    </button>
                                    <button
                                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 focus:outline-none"
                                        aria-label="Tài khoản"
                                    >
                                        <User className="h-6 w-6" />
                                    </button>
                                    {isUserDropdownOpen && <UserDropdown />}
                                </>
                            ) : (
                                <button
                                    onClick={() => navigate('/login')}
                                    className="flex h-10 items-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                                >
                                    <LogIn size={18} />
                                    <span>Đăng nhập</span>
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 focus:outline-none lg:hidden"
                            aria-label="Menu"
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="border-t bg-white lg:hidden">
                    <div className="px-4 pb-2 pt-3 md:hidden">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Tìm kiếm..."
                                className="w-full rounded-lg bg-gray-100 py-2 pl-4 pr-10 text-sm focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                                <Search size={18} />
                            </button>
                        </form>
                    </div>

                    <div className="space-y-1 border-b px-2 pb-3 pt-2">
                        {navLinks.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => handleMainClick(item.key, item.name)}
                                className={`block w-full rounded-md px-3 py-2 text-left text-base font-medium ${
                                    activeKey === item.key
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3 px-4 py-4">
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => {
                                        onOrdersClick();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex w-full items-center text-sm font-medium text-gray-700"
                                >
                                    <Package size={18} className="mr-3 text-gray-400" /> Đơn hàng của tôi
                                </button>
                                <button
                                    onClick={() => {
                                        onProfileClick();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex w-full items-center text-sm font-medium text-gray-700"
                                >
                                    <Settings size={18} className="mr-3 text-gray-400" /> Hồ sơ người dùng
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center text-sm font-medium text-red-600"
                                >
                                    <LogOut size={18} className="mr-3 text-red-400" /> Đăng xuất
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 font-bold text-white shadow-md transition-all active:scale-95"
                            >
                                <LogIn size={20} /> Đăng nhập ngay
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default UserNavbar;
