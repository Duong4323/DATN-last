<?php

namespace App\Http\Controllers\Api\Products;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Ánh xạ Key không dấu (Frontend) sang Tên có dấu (Database).
     * @param string $key Key không dấu từ Frontend (ví dụ: 'do-the-thao').
     * @return string|null Tên có dấu trong DB (ví dụ: 'Đồ thể thao') hoặc null.
     */
    private function getCategoryNameByKey($key) {
        // Mảng ánh xạ chính xác từ key không dấu (loại bỏ gạch ngang) sang tên có dấu
        $map = [
            'trangchu' => 'Trang chủ', 
            'ao' => 'áo',
            'quan' => 'quần',
            'vay' => 'váy',
            'dodong' => 'Đồ đông', // DB: đồ đông -> Đồ đông
            'dohe' => 'Đồ hè',     // DB: đồ hè -> Đồ hè
            'donam' => 'Đồ nam',
            'donu' => 'Đồ nữ',
            'dongu' => 'đồ ngủ',
            'dolot' => 'Đồ lót',
            'aokhoac' => 'áo khoác',
            'dothethao' => 'Đồ thể thao',
            'docongso' => 'Đồ công sở',
        ];
        
        // Chuẩn hóa key đầu vào: loại bỏ dấu gạch ngang và chuyển sang chữ thường
        $normalizedKey = strtolower(str_replace('-', '', $key));
        
        // Trả về tên có dấu tương ứng
        return $map[$normalizedKey] ?? null;
    }

    // -------------------------------------------------------------------
    // Lấy danh sách sản phẩm (Sắp xếp và Lọc)
    // -------------------------------------------------------------------
    public function index(Request $request)
    {
        $categoryKey = $request->query('categoryKey');
        
        $query = Product::with(['categories', 'images']);
        
        // --- Logic Lọc theo Danh mục ---
        if ($categoryKey && $categoryKey !== 'home') {
            
            // 1. Ánh xạ key không dấu từ Frontend sang tên có dấu trong DB
            $categoryName = $this->getCategoryNameByKey($categoryKey);

            if ($categoryName) {
                // 2. Lọc sản phẩm theo tên danh mục chính xác
                $query->whereHas('categories', function ($q) use ($categoryName) {
                    // So sánh chính xác tên Category có dấu
                    $q->where('name', $categoryName);
                });
            } else {
                // Nếu key không khớp với bất kỳ danh mục nào, trả về danh sách rỗng để tránh lỗi
                $query->whereRaw('1 = 0'); 
            }
        }
        
        // Sắp xếp mặc định: Bán chạy nhất
        $query->orderBy('sold', 'desc');

        $products = $query->get();
        return response()->json($products, 200);
    }

    // -------------------------------------------------------------------
    // Thêm sản phẩm mới
    // -------------------------------------------------------------------
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'sold' => 'nullable|integer|min:0',
            'categories' => 'nullable|array', 
            'categories.*' => 'integer|exists:categories,id', 
            'image_urls' => 'nullable|array',
            'image_urls.*' => 'string|url', 
        ]);

        $product = Product::create($validated);
        
        if (isset($validated['categories']) && is_array($validated['categories'])) {
            $product->categories()->attach($validated['categories']);
        }

        if (isset($validated['image_urls']) && is_array($validated['image_urls'])) {
            $imagesToCreate = [];
            foreach ($validated['image_urls'] as $index => $url) {
                $imagesToCreate[] = [
                    'url' => $url,
                    'is_thumbnail' => ($index === 0) 
                ];
            }
            $product->images()->createMany($imagesToCreate);
        }

        return response()->json($product->load(['categories', 'images']), 201);
    }

    // -------------------------------------------------------------------
    // Cập nhật sản phẩm
    // -------------------------------------------------------------------
    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'quantity' => 'sometimes|required|integer|min:0',
            'sold' => 'nullable|integer|min:0',
            'categories' => 'nullable|array', 
            'categories.*' => 'integer|exists:categories,id',
            'image_urls' => 'nullable|array',
            'image_urls.*' => 'string|url',
        ]);

        $product->update($validated);

        if (array_key_exists('categories', $validated)) {
            $product->categories()->sync($validated['categories'] ?? []);
        }

        if (array_key_exists('image_urls', $validated)) {
            $product->images()->delete(); 
            
            if (!empty($validated['image_urls'])) {
                $imagesToCreate = [];
                foreach ($validated['image_urls'] as $index => $url) {
                    $imagesToCreate[] = [
                        'url' => $url,
                        'is_thumbnail' => ($index === 0) 
                    ];
                }
                $product->images()->createMany($imagesToCreate);
            }
        }

        return response()->json($product->load(['categories', 'images']), 200);
    }

    // -------------------------------------------------------------------
    // Xóa sản phẩm
    // -------------------------------------------------------------------
    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }
        
        $product->categories()->detach();
        $product->images()->delete(); 

        $product->delete();
        return response()->json(['message' => 'Đã xóa sản phẩm'], 200);
    }

    // -------------------------------------------------------------------
    // Upload ảnh sản phẩm
    // -------------------------------------------------------------------
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $path = $request->file('image')->store('products', 'public');
        $url = asset('storage/' . $path);

        return response()->json([
            'message' => 'Tải ảnh lên thành công',
            'image_url' => $url,
        ], 201);
    }

    // -------------------------------------------------------------------
    // Xem chi tiết sản phẩm
    // -------------------------------------------------------------------
    public function show($id)
    {
        $product = Product::with(['categories', 'images'])->find($id);
        if (!$product) {
            return response()->json(['message' => 'Sản phẩm không tồn tại'], 404);
        }
        return response()->json($product, 200);
    }
}