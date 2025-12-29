import React, { useState, useEffect } from "react";
import { getProducts, createProduct, uploadProductImage, Product, Category, deleteProduct, updateProduct, ProductImage } from "../../api/productApi"; 
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import { message } from 'antd'; // <<< ĐÃ THÊM: Import module message từ Ant Design

// Danh sách Categories cố định
const ALL_CATEGORIES: Category[] = [
    { id: 1, name: "áo" }, { id: 2, name: "quần" }, { id: 3, name: "váy" },
    { id: 4, name: "đồ đông" }, { id: 5, name: "đồ hè" }, { id: 6, name: "đồ nam" },
    { id: 7, name: "đồ nữ" }, { id: 8, name: "đồ ngủ" }, { id: 9, name: "đồ lót" },
    { id: 10, name: "áo khoác" }, { id: 11, name: "đồ thể thao" }, { id: 12, name: "đồ công sở" }
];

// Định nghĩa lại các Interface (Giữ nguyên)
interface NewProductData {
    name: string;
    description: string;
    price: number;
    quantity: number;
    image_urls: string[]; 
    categories: number[];      
}

interface EditingProductData extends NewProductData {
    id: number;
}

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false); 
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentFormData, setCurrentFormData] = useState<NewProductData | EditingProductData>({
        name: '', description: '', price: 0, quantity: 0, image_urls: [], categories: [],
    });

    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0); 
    
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null); 

    // --- Tải dữ liệu ---
    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const data = await getProducts();
            setProducts(data);
        } catch (err) {
            console.error("Lỗi khi tải danh sách sản phẩm:", err);
            setError("Không thể tải dữ liệu sản phẩm. Vui lòng kiểm tra API.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // --- Chức năng Xem Chi Tiết ---
    const handleViewDetails = (product: Product) => {
        setSelectedProduct(product);
        setCurrentImageIndex(0); 
        setIsDetailModalOpen(true);
    };

    // --- Logic Chuyển Ảnh Slider ---
    const handleNextImage = () => {
        if (!selectedProduct || selectedProduct.images.length === 0) return;
        const totalImages = selectedProduct.images.length;
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % totalImages);
    };

    const handlePrevImage = () => {
        if (!selectedProduct || selectedProduct.images.length === 0) return;
        const totalImages = selectedProduct.images.length;
        setCurrentImageIndex(prevIndex => (prevIndex - 1 + totalImages) % totalImages);
    };


    // --- Xử lý Modal Thêm/Sửa (CRUD) ---

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentFormData({ name: '', description: '', price: 0, quantity: 0, image_urls: [], categories: [], });
        setSelectedImageFile(null);
        setIsFormModalOpen(true);
    };
    
    const handleEdit = (product: Product) => {
        setIsEditing(true);
        setCurrentFormData({
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.price,
            quantity: product.quantity,
            image_urls: product.images.map(img => img.url), 
            categories: product.categories.map(c => c.id),
        });
        setSelectedImageFile(null);
        setIsFormModalOpen(true);
    };
    
    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setIsEditing(false);
        setSelectedImageFile(null);
    };
    
    const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentFormData(prev => ({
            ...prev as NewProductData,
            [name]: name === 'price' || name === 'quantity' ? Number(value) : value,
        }));
    };
    
    const handleFormCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const categoryId = Number(e.target.value);
        const isChecked = e.target.checked;

        setCurrentFormData(prev => {
            const currentCategories = (prev as NewProductData).categories;
            if (isChecked) {
                return { ...prev as NewProductData, categories: [...currentCategories, categoryId] };
            } else {
                return { ...prev as NewProductData, categories: currentCategories.filter(id => id !== categoryId) };
            }
        });
    };

    const handleFormFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            setSelectedImageFile(null);
            return;
        }

        const file = files[0];
        
        try {
             setIsUploading(true);
             const uploadResult = await uploadProductImage(file);
             const newUrl = uploadResult.image_url;
             
             setCurrentFormData(prev => ({
                 ...prev as NewProductData,
                 image_urls: [...(prev as NewProductData).image_urls, newUrl] 
             }));
             message.success(`Tải ảnh ${file.name} lên thành công.`); // Sử dụng message.success

        } catch (err) {
            message.error(`Không thể tải ảnh ${file.name} lên.`); // Sử dụng message.error
            console.error(err);
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = ''; 
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let dataToSubmit = { ...currentFormData };

        try {
            let updatedOrCreatedProduct: Product;

            if (isEditing) {
                const id = (dataToSubmit as EditingProductData).id;
                updatedOrCreatedProduct = await updateProduct(id, dataToSubmit);
                
                setProducts(products.map(p => p.id === id ? updatedOrCreatedProduct : p));
                message.success(`Sản phẩm "${updatedOrCreatedProduct.name}" đã được CẬP NHẬT thành công!`); // Sửa alert thành message

            } else {
                updatedOrCreatedProduct = await createProduct(dataToSubmit);
                
                setProducts([...products, updatedOrCreatedProduct]);
                message.success(`Sản phẩm "${updatedOrCreatedProduct.name}" đã được THÊM MỚI thành công!`); // Sửa alert thành message
            }

            handleCloseFormModal();

        } catch (err: any) {
            setIsUploading(false);
            console.error(`Lỗi khi ${isEditing ? 'cập nhật' : 'thêm'} sản phẩm:`, err);
            
            const errorMessage = err.response?.data?.errors 
                ? Object.values(err.response.data.errors).flat().join(', ')
                : `Không thể ${isEditing ? 'cập nhật' : 'thêm'} sản phẩm. Vui lòng thử lại.`;
            message.error("Lỗi: " + errorMessage); // Sửa alert thành message
        }
    };

    // --- Hàm xử lý Xóa Sản Phẩm ---
    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" không?`)) {
            return;
        }

        try {
            await deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
            message.success(`Sản phẩm "${name}" đã được xóa thành công!`); // Sửa alert thành message
        } catch (err: any) {
            console.error("Lỗi khi xóa sản phẩm:", err);
            message.error("Không thể xóa sản phẩm. Vui lòng kiểm tra API."); // Sửa alert thành message
        }
    };
    
    // --- JSX (Giao diện) ---
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    🛍️ Quản lý sản phẩm
                </h1>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                >
                    + Thêm Sản Phẩm Mới
                </button>
            </div>
            
            {isLoading && <div className="text-center py-5 text-blue-500">Đang tải dữ liệu...</div>}
            {error && <div className="text-center py-5 text-red-600 font-bold">{error}</div>}

            {products.length === 0 && !isLoading && !error ? (
                 <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow-sm" role="alert">
                    <p className="font-bold">Không tìm thấy sản phẩm nào.</p>
                    <p>Hãy thêm sản phẩm mới để bắt đầu quản lý.</p>
                </div>
            ) : (
                <div className="shadow-xl rounded-lg overflow-hidden">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                            <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">ID</th>
                            <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Tên sản phẩm</th>
                            <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Loại</th>
                            <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Giá</th>
                            <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Tồn kho</th>
                            <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Còn lại</th> 
                            <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p.id} className="border-t hover:bg-indigo-50 transition duration-150 ease-in-out">
                                <td className="py-3 px-6 text-sm text-gray-800">{p.id}</td>
                                <td className="py-3 px-6 text-sm font-medium text-gray-900 cursor-pointer hover:underline"
                                    onClick={() => handleViewDetails(p)}
                                >
                                    {p.name}
                                </td>
                                <td className="py-3 px-6 text-sm text-gray-600">
                                    {p.categories?.slice(0, 2).map(c => (
                                        <span key={c.id} className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-1 mb-1 px-2.5 py-0.5 rounded-full">
                                            {c.name}
                                        </span>
                                    ))}
                                    {p.categories?.length > 2 && <span className="text-xs text-gray-500">...</span>}
                                </td>
                                <td className="py-3 px-6 text-sm text-green-600 font-bold">{p.price.toLocaleString('vi-VN')} ₫</td>
                                <td className="py-3 px-6 text-sm text-gray-600">{p.quantity}</td>
                                <td className="py-3 px-6 text-sm text-gray-600">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.remaining! > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {p.remaining}
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-sm flex space-x-2">
                                    <button 
                                        onClick={() => handleEdit(p)}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                                    >
                                        Sửa
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(p.id, p.name)}
                                        className="text-red-600 hover:text-red-900 font-medium"
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table >
                </div>
            )}
            
            {/* --- MODAL THÊM/SỬA SẢN PHẨM (CREATE/EDIT) --- */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-70 overflow-y-auto h-full w-full flex justify-center items-center">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-semibold text-gray-800">
                                {isEditing ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
                            </h3>
                            <button onClick={handleCloseFormModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            
                            {/* Tên Sản Phẩm */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Tên Sản Phẩm <span className="text-red-500">*</span></label>
                                <input id="name" name="name" type="text" value={currentFormData.name} onChange={handleFormInputChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-indigo-300" />
                            </div>

                            {/* CHỌN ẢNH SẢN PHẨM (Nhiều ảnh) */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">Thêm Ảnh Sản Phẩm</label>
                                <input id="image" name="image" type="file" accept="image/*" onChange={handleFormFileChange} disabled={isUploading} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-indigo-300 disabled:bg-gray-100" />
                                
                                {isUploading && <p className="text-blue-500 text-sm mt-1">Đang tải ảnh lên...</p>}
                                
                                <div className="mt-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto border p-1 rounded">
                                    {currentFormData.image_urls.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img src={url} alt={`Ảnh ${index}`} className="w-12 h-12 object-cover rounded" />
                                            {/* Nút xóa ảnh */}
                                            <button 
                                                type="button" 
                                                onClick={() => setCurrentFormData(prev => ({...prev as NewProductData, image_urls: (prev as NewProductData).image_urls.filter((_, i) => i !== index)}))}
                                                className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                    {currentFormData.image_urls.length === 0 && (
                                        <p className="text-xs text-gray-400 p-2">Chưa có ảnh nào được tải lên.</p>
                                    )}
                                </div>
                            </div>


                            {/* CHỌN LOẠI SẢN PHẨM (CHECKBOXES) */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Chọn Loại Sản Phẩm</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 p-3 border rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                                    {ALL_CATEGORIES.map((cat) => (
                                        <div key={cat.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`category-form-${cat.id}`}
                                                name="categories"
                                                value={cat.id}
                                                checked={currentFormData.categories.includes(cat.id)}
                                                onChange={handleFormCategoryChange}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <label htmlFor={`category-form-${cat.id}`} className="ml-2 text-sm text-gray-700 select-none">
                                                {cat.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Giá & Tồn Kho */}
                            <div className="flex space-x-4 mb-4">
                                <div className="flex-1">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">Giá <span className="text-red-500">*</span></label>
                                    <input id="price" name="price" type="number" value={currentFormData.price} onChange={handleFormInputChange} min="0" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-indigo-300" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">Tồn Kho <span className="text-red-500">*</span></label>
                                    <input id="quantity" name="quantity" type="number" value={currentFormData.quantity} onChange={handleFormInputChange} min="0" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-indigo-300" />
                                </div>
                            </div>

                            {/* Mô tả */}
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">Mô tả</label>
                                <textarea id="description" name="description" rows={3} value={currentFormData.description} onChange={handleFormInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-indigo-300"></textarea>
                            </div>

                            {/* Nút Thao Tác */}
                            <div className="flex items-center justify-end">
                                <button type="button" onClick={handleCloseFormModal} disabled={isUploading} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2">Hủy</button>
                                <button type="submit" disabled={isUploading || isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50">
                                    {isUploading ? 'Đang tải ảnh...' : (isEditing ? 'Cập Nhật' : 'Thêm Sản Phẩm')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* --- MODAL XEM CHI TIẾT (VIEW DETAILS) - ĐÃ CÓ SLIDER --- */}
            {isDetailModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-70 overflow-y-auto h-full w-full flex justify-center items-center">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-2xl font-bold text-gray-800">Chi Tiết Sản Phẩm: {selectedProduct.name}</h3>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Cột 1: IMAGE SLIDER (Gallery Ảnh) */}
                            <div>
                                <h4 className="text-lg font-semibold mb-2 text-gray-700">Ảnh ({selectedProduct.images.length > 0 ? currentImageIndex + 1 : 0}/{selectedProduct.images.length})</h4>
                                <div className="relative border border-gray-200 rounded-lg overflow-hidden shadow-md h-64 flex items-center justify-center bg-gray-100">
                                    
                                    {/* Ảnh Hiển Thị */}
                                    {selectedProduct.images.length > 0 ? (
                                        <img 
                                            src={selectedProduct.images[currentImageIndex].url} 
                                            alt={`${selectedProduct.name} - Ảnh ${currentImageIndex + 1}`} 
                                            className="object-contain w-full h-full transition duration-300"
                                        />
                                    ) : (
                                        <p className="text-gray-500">Chưa có ảnh sản phẩm</p>
                                    )}

                                    {/* Nút Điều Hướng TRÁI */}
                                    {selectedProduct.images.length > 1 && (
                                        <button 
                                            onClick={handlePrevImage}
                                            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-r-lg hover:bg-opacity-70 transition focus:outline-none"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                    )}
                                    
                                    {/* Nút Điều Hướng PHẢI */}
                                    {selectedProduct.images.length > 1 && (
                                        <button 
                                            onClick={handleNextImage}
                                            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-l-lg hover:bg-opacity-70 transition focus:outline-none"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    )}
                                </div>
                                {/* Thêm thumbnail nhỏ dưới đây (Tùy chọn) */}
                                <div className="flex mt-2 space-x-2 overflow-x-auto">
                                    {selectedProduct.images.map((img, index) => (
                                        <img
                                            key={index}
                                            src={img.url}
                                            alt={`Thumbnail ${index + 1}`}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`w-12 h-12 object-cover rounded cursor-pointer border-2 ${index === currentImageIndex ? 'border-indigo-500' : 'border-gray-300'}`}
                                        />
                                    ))}
                                </div>

                            </div>
                            
                            {/* Cột 2: Thông tin chi tiết */}
                            <div className="space-y-3">
                                <DetailItem label="ID" value={selectedProduct.id} />
                                <DetailItem label="Giá" value={`${selectedProduct.price.toLocaleString('vi-VN')} ₫`} className="text-green-600 font-bold" />
                                <DetailItem label="Tổng số lượng" value={selectedProduct.quantity} />
                                <DetailItem label="Đã bán" value={selectedProduct.sold} />
                                <DetailItem label="Còn lại" value={selectedProduct.remaining} className={selectedProduct.remaining! <= 10 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'} />

                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Loại Sản Phẩm:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProduct.categories?.map(c => (
                                            <span key={c.id} className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full shadow-sm">
                                                {c.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mô tả (Đầy đủ) */}
                        <div className="mt-6 border-t pt-4">
                            <h4 className="text-lg font-semibold mb-2 text-gray-700">Mô tả chi tiết</h4>
                            <p className="text-gray-600 whitespace-pre-line">{selectedProduct.description || "Không có mô tả."}</p>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Component con hỗ trợ hiển thị chi tiết
const DetailItem: React.FC<{ label: string; value: any; className?: string }> = ({ label, value, className = '' }) => (
    <div className="flex justify-between border-b border-gray-100 py-1">
        <span className="text-gray-500 text-sm">{label}:</span>
        <span className={`text-gray-800 text-sm font-medium ${className}`}>{value}</span>
    </div>
);

export default Products;