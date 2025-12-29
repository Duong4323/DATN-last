import React from 'react';

const UserFooter: React.FC = () => {
    return (
        <footer className="bg-gray-800 text-white mt-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Cột 1: Giới thiệu */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 border-b border-indigo-500 pb-1">Về Chúng Tôi</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-white transition duration-150">Lịch sử phát triển</a></li>
                            <li><a href="#" className="hover:text-white transition duration-150">Tuyển dụng</a></li>
                            <li><a href="#" className="hover:text-white transition duration-150">Hệ thống cửa hàng</a></li>
                        </ul>
                    </div>
                    
                    {/* Cột 2: Hỗ trợ Khách hàng */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 border-b border-indigo-500 pb-1">Hỗ Trợ</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-white transition duration-150">Chính sách đổi trả</a></li>
                            <li><a href="#" className="hover:text-white transition duration-150">Hướng dẫn mua hàng</a></li>
                            <li><a href="#" className="hover:text-white transition duration-150">Liên hệ</a></li>
                        </ul>
                    </div>

                    {/* Cột 3: Theo dõi */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 border-b border-indigo-500 pb-1">Theo Dõi</h3>
                        <div className="flex space-x-3 text-2xl">
                            {/* Icons mạng xã hội (cần thêm icons thực tế) */}
                            <i className="fab fa-facebook-f hover:text-indigo-400"></i>
                            <i className="fab fa-instagram hover:text-indigo-400"></i>
                            <i className="fab fa-twitter hover:text-indigo-400"></i>
                        </div>
                    </div>

                    {/* Cột 4: Thông tin liên hệ */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 border-b border-indigo-500 pb-1">Liên Hệ</h3>
                        <p className="text-sm text-gray-400">Email: info@shop.com</p>
                        <p className="text-sm text-gray-400">Hotline: 1900 6868</p>
                    </div>
                </div>
                
                <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} SHOP. Thiết kế bởi Gemini.</p>
                </div>
            </div>
        </footer>
    );
};

export default UserFooter;