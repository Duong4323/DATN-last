import axios from "axios";

const PUBLIC_PRODUCTS_URL = `${import.meta.env.VITE_API_URL}/products`;
const CATEGORIES_URL = `${import.meta.env.VITE_API_URL}/categories`;
const SHOP_PRODUCTS_URL = `${import.meta.env.VITE_API_URL}/shop/products`;

// --- Định nghĩa Kiểu dữ liệu ---

export interface ProductImage {
    id: number;
    product_id: number;
    url: string;
    is_thumbnail: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    slug?: string | null;
}

export interface ShopSummary {
    id: number;
    name: string;
    logo_url?: string | null;
    description?: string | null;
    address?: string | null;
}

export interface ProductReview {
    id: number;
    product_id: number;
    user_id: number;
    rating: number;
    comment: string | null;
    image_url: string | null;
    user?: {
        id: number;
        name: string;
    };
    created_at: string;
}

export type ProductStockBySize = Record<string, number>;
export type ProductColorStock = Record<string, ProductStockBySize>;

export interface Product {
    id: number;
    shop_owner_id?: number;
    name: string;
    brand?: string | null;
    colors?: string[] | null;
    material?: string | null;
    origin?: string | null;
    design_style?: string | null;
    fashion_style?: string | null;
    description: string | null;
    categories: Category[];
    price: number;
    quantity: number;
    size_details: ProductColorStock;
    available_sizes: string[];
    available_colors?: string[];
    sold: number;
    thumbnail_url: string | null;
    images: ProductImage[];
    remaining: number;
    shop?: ShopSummary | null;
    shop_name?: string | null;
    created_at: string;
    updated_at: string;
}

// ----------------------------------------------------
// TOKEN HEADER
// ----------------------------------------------------

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ----------------------------------------------------
// PUBLIC PRODUCTS
// ----------------------------------------------------

export const getProducts = async (
    categoryKey?: string,
    search?: string
): Promise<Product[]> => {
    const response = await axios.get<Product[]>(PUBLIC_PRODUCTS_URL, {
        params: {
            categoryKey: categoryKey && !["home", "all"].includes(categoryKey) ? categoryKey : undefined,
            search: search || undefined,
        },
    });

    return response.data;
};

export const getProductById = async (
    id: number | string
): Promise<Product> => {
    const response = await axios.get<Product>(
        `${PUBLIC_PRODUCTS_URL}/${id}`
    );

    return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
    const response = await axios.get<Category[]>(CATEGORIES_URL);

    return response.data;
};

// ----------------------------------------------------
// REVIEWS
// ----------------------------------------------------

export const getProductReviews = async (
    productId: number | string
): Promise<ProductReview[]> => {
    const response = await axios.get<ProductReview[]>(
        `${PUBLIC_PRODUCTS_URL}/${productId}/reviews`
    );

    return response.data;
};

export const submitProductReview = async (
    formData: FormData
): Promise<any> => {
    const response = await axios.post(
        `${PUBLIC_PRODUCTS_URL}/reviews`,
        formData,
        {
            headers: {
                ...authHeaders(),
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};

// ----------------------------------------------------
// SHOP PRODUCTS
// ----------------------------------------------------

export const getMyShopProducts = async (): Promise<Product[]> => {
    const response = await axios.get<Product[]>(SHOP_PRODUCTS_URL, {
        headers: authHeaders(),
    });

    return response.data;
};

export const createProduct = async (data: {
    name: string;
    brand?: string;
    colors?: string[];
    material?: string;
    origin?: string;
    design_style?: string;
    fashion_style?: string;
    description: string;
    price: number;
    size_details: ProductColorStock;
    categories: number[];
    image_urls: string[];
}): Promise<Product> => {
    const response = await axios.post<Product>(
        SHOP_PRODUCTS_URL,
        data,
        {
            headers: authHeaders(),
        }
    );

    return response.data;
};

export const updateProduct = async (
    id: number | string,
    data: {
        name?: string;
        brand?: string;
        colors?: string[];
        material?: string;
        origin?: string;
        design_style?: string;
        fashion_style?: string;
        description?: string;
        price?: number;
        size_details?: ProductColorStock;
        categories?: number[];
        image_urls?: string[];
    }
): Promise<Product> => {
    const response = await axios.put<Product>(
        `${SHOP_PRODUCTS_URL}/${id}`,
        data,
        {
            headers: authHeaders(),
        }
    );

    return response.data;
};

export const deleteProduct = async (
    id: number | string
): Promise<any> => {
    const response = await axios.delete(
        `${SHOP_PRODUCTS_URL}/${id}`,
        {
            headers: authHeaders(),
        }
    );

    return response.data;
};

export const uploadProductImage = async (
    imageFile: File
): Promise<{ message: string; image_url: string }> => {
    const formData = new FormData();

    formData.append("image", imageFile);

    const response = await axios.post<{
        message: string;
        image_url: string;
    }>(
        `${SHOP_PRODUCTS_URL}/upload-image`,
        formData,
        {
            headers: {
                ...authHeaders(),
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};
