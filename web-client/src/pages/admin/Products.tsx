import React, { useState, useEffect } from "react";
import { getProducts, getCategories, createProduct, uploadProductImage, Product, Category, ProductColorStock, deleteProduct, updateProduct } from "../../api/productApi"; 
import { Plus, Trash2, Package } from 'lucide-react'; 
import { message } from 'antd';

const FALLBACK_CATEGORIES: Category[] = [
    { id: 1, name: "Áo" }, { id: 2, name: "Quần" }, { id: 3, name: "Váy/Đầm" },
    { id: 4, name: "Giày dép" }, { id: 5, name: "Túi xách" }, { id: 6, name: "Phụ kiện" },
    { id: 7, name: "Set đồ" }, { id: 8, name: "Đồ ngủ" }, { id: 9, name: "Đồ lót" },
    { id: 10, name: "Áo khoác" }, { id: 11, name: "Đồ thể thao" }, { id: 12, name: "Đồ công sở" }
];

const APPAREL_SIZE_LIST = ["S", "M", "L", "XL", "XXL", "3XL", "Free Size"];
const SHOE_SIZE_LIST = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
const NO_SIZE_LABEL = "Không size";
const normalizeCategoryText = (value: unknown) => String(value ?? "").toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

interface NewProductData {
    name: string;
    brand: string;
    material: string;
    origin: string;
    design_style: string;
    fashion_style: string;
    colors: string[];
    description: string;
    price: number;
    size_details: ProductColorStock; 
    image_urls: string[]; 
    categories: number[];      
}

interface EditingProductData extends NewProductData {
    id: number;
}

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false); 
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [currentFormData, setCurrentFormData] = useState<NewProductData | EditingProductData>({
        name: '', brand: '', material: '', origin: '', design_style: '', fashion_style: '', colors: [], description: '', price: 0, size_details: {}, image_urls: [], categories: [],
    });

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const data = await getProducts();
            setProducts(data);
        } catch (err) {
            message.error("Không thể tải dữ liệu sản phẩm.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        getCategories()
            .then((data) => {
                if (data.length > 0) setCategories(data);
            })
            .catch(() => {
                message.warning("Không thể tải danh mục sản phẩm, tạm dùng danh mục mặc định.");
            });
    }, []);

    const normalizeStock = (stock?: Record<string, any> | null): ProductColorStock => {
        if (!stock) return {};
        const hasNestedStock = Object.values(stock).some((value) => value && typeof value === 'object' && !Array.isArray(value));
        if (hasNestedStock) return stock as ProductColorStock;

        return {
            "Mac dinh": Object.entries(stock).reduce<Record<string, number>>((acc, [size, qty]) => {
                acc[size] = Number(qty) || 0;
                return acc;
            }, {}),
        };
    };

    const getTotalStock = (stock: ProductColorStock) => Object.values(stock).reduce((sum, sizes) => {
        return sum + Object.values(sizes).reduce((sizeSum, qty) => sizeSum + Number(qty || 0), 0);
    }, 0);
    const selectedCategoryTexts = categories
        .filter((category) => currentFormData.categories.includes(category.id))
        .map((category) => normalizeCategoryText(category.name));
    const isNoSizeProduct = selectedCategoryTexts.some((name) => name.includes("tui xach") || name.includes("phu kien"));
    const sizeOptions = selectedCategoryTexts.some((name) => name.includes("giay")) ? SHOE_SIZE_LIST : APPAREL_SIZE_LIST;

    const renderStockBadges = (stock: Record<string, any>) => {
        const normalized = normalizeStock(stock);

        return Object.entries(normalized).flatMap(([color, sizes]) =>
            Object.entries(sizes).map(([size, qty]) => (
                <span key={`${color}-${size}`} className="bg-white border border-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-lg font-bold">
                    {color}: {size} <span className={qty > 0 ? 'text-indigo-600' : 'text-red-500'}>{qty}</span>
                </span>
            ))
        );
    };

    // --- LOGIC MÀU, SIZE & KHO ---
    const handleAddColorRow = () => {
        const color = window.prompt("Nhập màu sản phẩm:");
        const normalizedColor = color?.trim();
        if (!normalizedColor) return;
        if (currentFormData.size_details[normalizedColor]) return message.warning("Màu này đã tồn tại.");

        setCurrentFormData(prev => ({
            ...prev,
            colors: Array.from(new Set([...prev.colors, normalizedColor])),
            size_details: { ...prev.size_details, [normalizedColor]: isNoSizeProduct ? { [NO_SIZE_LABEL]: 0 } : {} } as ProductColorStock,
        }));
    };

    const handleRemoveColorRow = (color: string) => {
        const newDetails = { ...currentFormData.size_details };
        delete newDetails[color];
        setCurrentFormData(prev => ({
            ...prev,
            colors: prev.colors.filter(item => item !== color),
            size_details: newDetails,
        }));
    };

    const handleAddSizeRow = (color: string) => {
        const sizes = currentFormData.size_details[color] || {};
        if (isNoSizeProduct) {
            if (Object.prototype.hasOwnProperty.call(sizes, NO_SIZE_LABEL)) return message.warning("Loại sản phẩm này không cần size.");
            setCurrentFormData(prev => ({
                ...prev,
                size_details: {
                    ...prev.size_details,
                    [color]: { [NO_SIZE_LABEL]: 0 },
                },
            }));
            return;
        }
        const available = sizeOptions.find(s => !Object.prototype.hasOwnProperty.call(sizes, s));
        if (!available) return message.warning("Đã hết size để chọn cho màu này.");
        setCurrentFormData(prev => ({
            ...prev,
            size_details: {
                ...prev.size_details,
                [color]: { ...(prev.size_details[color] || {}), [available]: 0 },
            },
        }));
    };

    const handleUpdateSizeQty = (color: string, size: string, qty: number) => {
        setCurrentFormData(prev => ({
            ...prev,
            size_details: {
                ...prev.size_details,
                [color]: { ...(prev.size_details[color] || {}), [size]: Math.max(0, qty) },
            },
        }));
    };

    const handleRenameSizeRow = (color: string, oldSize: string, newSize: string) => {
        setCurrentFormData(prev => {
            const colorSizes = { ...(prev.size_details[color] || {}) };
            const qty = colorSizes[oldSize] || 0;
            delete colorSizes[oldSize];
            colorSizes[newSize] = qty;
            return { ...prev, size_details: { ...prev.size_details, [color]: colorSizes } };
        });
    };

    const handleRemoveSizeRow = (color: string, size: string) => {
        setCurrentFormData(prev => {
            const colorSizes = { ...(prev.size_details[color] || {}) };
            delete colorSizes[size];
            return { ...prev, size_details: { ...prev.size_details, [color]: colorSizes } };
        });
    };

    // --- LOGIC CATEGORIES ---
    const handleCategoryChange = (categoryId: number) => {
        setCurrentFormData(prev => {
            const isChecked = prev.categories.includes(categoryId);
            if (isChecked) {
                return { ...prev, categories: prev.categories.filter(id => id !== categoryId) };
            } else {
                return { ...prev, categories: [...prev.categories, categoryId] };
            }
        });
    };

    // --- LOGIC HÌNH ẢNH ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsUploading(true);
            const res = await uploadProductImage(file);
            setCurrentFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, res.image_url] }));
            message.success("Tải ảnh thành công!");
        } catch (err) {
            message.error("Không thể tải dữ liệu sản phẩm.");
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    // --- CRUD ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = isNoSizeProduct
            ? {
                ...currentFormData,
                size_details: Object.entries(currentFormData.size_details).reduce<ProductColorStock>((acc, [color, sizes]) => {
                    acc[color] = { [NO_SIZE_LABEL]: Object.values(sizes).reduce((sum, qty) => sum + Number(qty || 0), 0) };
                    return acc;
                }, {}),
            }
            : currentFormData;

        try {
            if (isEditing) {
                const updated = await updateProduct((currentFormData as EditingProductData).id, payload);
                setProducts(products.map(p => p.id === updated.id ? updated : p));
                message.success("Đã cập nhật!");
            } else {
                const created = await createProduct(payload);
                setProducts([created, ...products]);
                message.success("Đã thêm sản phẩm!");
            }
            setIsFormModalOpen(false);
        } catch (err) {
            message.error("Không thể tải dữ liệu sản phẩm.");
        }
    };

    if (isLoading) {
        return <div className="p-10 text-center font-bold text-indigo-600">Đang tải sản phẩm...</div>;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <Package className="text-indigo-600" size={32} /> Quản lý sản phẩm
                </h1>
                <button onClick={() => { setIsEditing(false); setCurrentFormData({ name: '', brand: '', material: '', origin: '', design_style: '', fashion_style: '', colors: [], description: '', price: 0, size_details: {}, image_urls: [], categories: [] }); setIsFormModalOpen(true); }} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95">
                    + Thêm mới
                </button>
            </div>

            {/* DANH SÁCH SẢN PHẨM */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="py-4 px-6 text-left font-black text-gray-400 uppercase">Sản phẩm</th>
                            <th className="py-4 px-6 text-left font-black text-gray-400 uppercase">Kho hàng (Size)</th>
                            <th className="py-4 px-6 text-left font-black text-gray-400 uppercase">Giá bán</th>
                            <th className="py-4 px-6 text-right font-black text-gray-400 uppercase">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {products.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-4">
                                        <img src={p.thumbnail_url || ''} className="w-14 h-14 object-cover rounded-2xl border border-gray-100" alt="" />
                                        <div>
                                            <div className="font-bold text-gray-900">{p.name}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">ID: #{p.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex flex-wrap gap-2">
                                        {renderStockBadges(p.size_details || {})}
                                    </div>
                                </td>
                                <td className="py-4 px-6 font-black text-gray-900">{p.price.toLocaleString()} ₫</td>
                                <td className="py-4 px-6 text-right space-x-4">
                                    <button onClick={() => { const normalizedStock = normalizeStock(p.size_details); setIsEditing(true); setCurrentFormData({ id: p.id, name: p.name, brand: p.brand || '', material: p.material || '', origin: p.origin || '', design_style: p.design_style || '', fashion_style: p.fashion_style || '', colors: p.colors?.length ? p.colors : Object.keys(normalizedStock), description: p.description || '', price: p.price, size_details: normalizedStock, image_urls: p.images.map(i => i.url), categories: p.categories.map(c => c.id) }); setIsFormModalOpen(true); }} className="text-indigo-600 font-bold hover:underline">Sửa</button>
                                    <button onClick={() => { if(window.confirm('Xóa?')) { deleteProduct(p.id).then(() => fetchProducts()); } }} className="text-red-500 font-bold hover:underline">Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL THÊM/SỬA */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto p-10 relative">
                        <button onClick={() => setIsFormModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
                        
                        <h2 className="text-2xl font-black mb-8">{isEditing ? '🚀 Cập nhật sản phẩm' : '🎁 Thêm sản phẩm mới'}</h2>
                        
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* CỘT TRÁI (7/12): THÔNG TIN CƠ BẢN */}
                            <div className="lg:col-span-7 space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tên sản phẩm</label>
                                    <input type="text" value={currentFormData.name} onChange={e => setCurrentFormData({...currentFormData, name: e.target.value})} required className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Giá bán (₫)</label>
                                        <input type="number" value={currentFormData.price} onChange={e => setCurrentFormData({...currentFormData, price: Number(e.target.value)})} required className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
                                    </div>
                                    <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex flex-col justify-center">
                                        <label className="block text-[10px] font-black text-indigo-400 uppercase">Tổng tồn kho</label>
                                        <div className="text-xl font-black text-indigo-600">{getTotalStock(currentFormData.size_details)}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Thương hiệu</label>
                                        <input type="text" value={currentFormData.brand} onChange={e => setCurrentFormData({...currentFormData, brand: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Chất liệu</label>
                                        <input type="text" value={currentFormData.material} onChange={e => setCurrentFormData({...currentFormData, material: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Xuất xứ</label>
                                        <input type="text" value={currentFormData.origin} onChange={e => setCurrentFormData({...currentFormData, origin: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Kiểu dáng</label>
                                        <input type="text" value={currentFormData.design_style} onChange={e => setCurrentFormData({...currentFormData, design_style: e.target.value})} placeholder="Slim fit, oversize, dáng suông..." className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Phong cách</label>
                                        <input type="text" value={currentFormData.fashion_style} onChange={e => setCurrentFormData({...currentFormData, fashion_style: e.target.value})} placeholder="Công sở, tối giản, streetwear..." className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Màu sắc</label>
                                        <input type="text" value={currentFormData.colors.join(', ')} onChange={e => {
                                            const colors = e.target.value.split(',').map(color => color.trim()).filter(Boolean);
                                            const nextStock = colors.reduce<ProductColorStock>((acc, color) => {
                                                acc[color] = currentFormData.size_details[color] || (isNoSizeProduct ? { [NO_SIZE_LABEL]: 0 } : {});
                                                return acc;
                                            }, {});
                                            setCurrentFormData({...currentFormData, colors, size_details: nextStock});
                                        }} placeholder="Den, trang, be..." className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Mô tả</label>
                                    <textarea rows={3} value={currentFormData.description} onChange={e => setCurrentFormData({...currentFormData, description: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
                                </div>

                                {/* PHẦN CHỌN LOẠI SẢN PHẨM (ĐÃ THÊM LẠI) */}
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-3 flex items-center gap-2">
                                        Loại sản phẩm
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        {categories.map((cat) => (
                                            <label key={cat.id} className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all border ${currentFormData.categories.includes(cat.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={currentFormData.categories.includes(cat.id)}
                                                    onChange={() => handleCategoryChange(cat.id)}
                                                />
                                                <span className="text-[11px] font-bold truncate">{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* CỘT PHẢI (5/12): SIZE & ẢNH */}
                            <div className="lg:col-span-5 space-y-8">
                                {/* PHẦN SIZE */}
                                <div className="bg-gray-900 rounded-[24px] p-6 text-white">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-xs font-black text-gray-400 uppercase">Màu, kích thước & kho</label>
                                        <button type="button" onClick={handleAddColorRow} className="bg-indigo-600 text-white p-1 rounded-lg hover:rotate-90 transition-all"><Plus size={18}/></button>
                                    </div>
                                    <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                        {Object.entries(currentFormData.size_details).map(([color, sizes]) => (
                                            <div key={color} className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                    <input
                                                        value={color}
                                                        onChange={e => {
                                                            const nextColor = e.target.value.trim();
                                                            if (!nextColor || nextColor === color) return;
                                                            setCurrentFormData(prev => {
                                                                const nextDetails = { ...prev.size_details };
                                                                nextDetails[nextColor] = nextDetails[color] || {};
                                                                delete nextDetails[color];
                                                                return {
                                                                    ...prev,
                                                                    colors: prev.colors.map(item => item === color ? nextColor : item),
                                                                    size_details: nextDetails,
                                                                };
                                                            });
                                                        }}
                                                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-black text-white"
                                                    />
                                                    {!isNoSizeProduct && <button type="button" onClick={() => handleAddSizeRow(color)} className="bg-white/10 text-white p-1 rounded-lg hover:bg-white/20"><Plus size={16}/></button>}
                                                    <button type="button" onClick={() => handleRemoveColorRow(color)} className="text-red-400 hover:text-red-500"><Trash2 size={16}/></button>
                                                </div>
                                                <div className="space-y-2">
                                                    {Object.entries(sizes).map(([size, qty]) => (
                                                        <div key={`${color}-${size}`} className="flex items-center gap-3 bg-black/20 p-2 rounded-xl">
                                                            {!isNoSizeProduct ? (
                                                                <select value={size} onChange={e => handleRenameSizeRow(color, size, e.target.value)} className="bg-transparent border-none text-xs font-bold focus:ring-0 text-white cursor-pointer">
                                                                    {sizeOptions.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                                                                </select>
                                                            ) : (
                                                                <span className="text-xs font-bold text-gray-300">Không size</span>
                                                            )}
                                                            <input type="number" min={0} value={qty} onChange={e => handleUpdateSizeQty(color, size, Number(e.target.value))} className="w-full bg-transparent border-none focus:ring-0 text-right font-black text-indigo-400" />
                                                            <button type="button" onClick={() => handleRemoveSizeRow(color, size)} className="text-red-400 hover:text-red-500"><Trash2 size={16}/></button>
                                                        </div>
                                                    ))}
                                                    {Object.keys(sizes).length === 0 && <p className="text-[10px] text-gray-500 italic text-center py-2">Chưa có size cho màu này</p>}
                                                </div>
                                            </div>
                                        ))}
                                        {Object.keys(currentFormData.size_details).length === 0 && <p className="text-[10px] text-gray-500 italic text-center py-2">Chưa có màu nào</p>}
                                    </div>
                                </div>

                                {/* PHẦN ẢNH */}
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Bộ sưu tập ảnh ({currentFormData.image_urls.length})</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition">
                                            {isUploading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div> : <Plus className="text-indigo-400" />}
                                            <input type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                                        </label>
                                        {currentFormData.image_urls.map((url, idx) => (
                                            <div key={idx} className="relative group aspect-square">
                                                <img src={url} className="w-full h-full object-cover rounded-2xl border border-gray-100 shadow-sm" alt="" />
                                                <button type="button" onClick={() => setCurrentFormData({...currentFormData, image_urls: currentFormData.image_urls.filter((_, i) => i !== idx)})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg"><Trash2 size={12}/></button>
                                                {idx === 0 && <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] px-2 py-0.5 rounded-md font-black uppercase shadow-sm">Bìa</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition active:scale-[0.98] uppercase tracking-widest text-sm">
                                    Xác nhận lưu sản phẩm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
