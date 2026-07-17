<?php

namespace App\Http\Controllers\Api\Products;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use App\Services\ProductVectorSyncService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    private function checkOwnerRole($user)
    {
        return $user && in_array($user->role, ['admin', 'shop_owner']);
    }

    private function normalizeCategoryKey(?string $key): ?string
    {
        if (!$key || $key === 'home') {
            return null;
        }

        return (string) Str::of($key)->lower()->ascii()->replace([' ', '-', '_'], '');
    }

    private function resolveCategoryIdsByKey(?string $key): array
    {
        $normalizedKey = $this->normalizeCategoryKey($key);

        if (!$normalizedKey) {
            return [];
        }

        return Category::query()
            ->get(['id', 'name', 'slug'])
            ->filter(function (Category $category) use ($normalizedKey) {
                $slug = $category->slug ?: Str::slug($category->name);
                $normalizedSlug = (string) Str::of($slug)->lower()->ascii()->replace([' ', '-', '_'], '');
                $normalizedName = (string) Str::of($category->name)->lower()->ascii()->replace([' ', '-', '_'], '');

                return $normalizedKey === (string) $category->id
                    || $normalizedKey === $normalizedSlug
                    || $normalizedKey === $normalizedName;
            })
            ->pluck('id')
            ->values()
            ->toArray();
    }

    private function resolveCategoryIdsBySearch(?string $search): array
    {
        if (!$search) {
            return [];
        }

        $normalizedSearch = (string) Str::of($search)->lower()->ascii()->replace([' ', '-', '_'], '');
        $categoryAliases = [
            'ao' => ['ao'],
            'dothethao' => ['dothethao', 'thethao'],
            'dongu' => ['dongu'],
            'vaydam' => ['vay', 'dam', 'vaydam'],
            'giaydep' => ['giay', 'giaydep', 'dep'],
            'phukien' => ['phukien'],
            'tuixach' => ['tui', 'tuixach'],
        ];

        foreach ($categoryAliases as $categoryKey => $aliases) {
            if (in_array($normalizedSearch, $aliases, true)) {
                return $this->resolveCategoryIdsByKey($categoryKey);
            }
        }

        return [];
    }

    private function applyTextSearch($query, string $search): void
    {
        $likeSearch = '%' . $search . '%';

        $query->where(function ($q) use ($likeSearch) {
            $q->where('name', 'ILIKE', $likeSearch)
                ->orWhere('brand', 'ILIKE', $likeSearch)
                ->orWhere('material', 'ILIKE', $likeSearch)
                ->orWhere('origin', 'ILIKE', $likeSearch)
                ->orWhere('design_style', 'ILIKE', $likeSearch)
                ->orWhere('fashion_style', 'ILIKE', $likeSearch)
                ->orWhere('description', 'ILIKE', $likeSearch);
        });

        $query->orderByRaw('CASE WHEN name ILIKE ? THEN 0 ELSE 1 END', [$likeSearch]);
    }

    public function index(Request $request)
    {
        $categoryKey = $request->query('categoryKey');
        $search = $request->query('search');

        $query = Product::with([
            'categories',
            'images',
            'shop',
            'shop.owner',
            'variantStocks',
        ]);

        if ($categoryKey && $categoryKey !== 'home') {
            $categoryIds = $this->resolveCategoryIdsByKey($categoryKey);

            if (!empty($categoryIds)) {
                $query->whereHas('categories', function ($q) use ($categoryIds) {
                    $q->whereIn('categories.id', $categoryIds);
                });
            }
        }

        if (!empty($search)) {
            $searchCategoryIds = $this->resolveCategoryIdsBySearch($search);

            if (!empty($searchCategoryIds)) {
                $query->whereHas('categories', function ($q) use ($searchCategoryIds) {
                    $q->whereIn('categories.id', $searchCategoryIds);
                });
            } else {
                $this->applyTextSearch($query, $search);
            }
        }

        $products = $query->orderBy('sold', 'desc')->get();

        return response()->json($products, 200);
    }

    public function myProducts(Request $request)
    {
        $user = $request->user();

        if (!$this->checkOwnerRole($user)) {
            return response()->json([
                'message' => 'Bạn không có quyền xem danh sách sản phẩm của cửa hàng.'
            ], 403);
        }

        if (!$user->shop) {
            return response()->json([
                'message' => 'Tài khoản này chưa có cửa hàng.'
            ], 404);
        }

        $products = Product::with(['categories', 'images', 'shop', 'variantStocks'])
            ->where('shop_id', $user->shop->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($products, 200);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!$this->checkOwnerRole($user)) {
            return response()->json([
                'message' => 'Bạn không có quyền thêm sản phẩm.'
            ], 403);
        }

        if (!$user->shop) {
            return response()->json([
                'message' => 'Bạn cần tạo cửa hàng trước khi thêm sản phẩm.'
            ], 400);
        }

        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'brand'        => 'nullable|string|max:255',
            'colors'       => 'nullable|array',
            'colors.*'     => 'string|max:100',
            'material'     => 'nullable|string|max:255',
            'origin'       => 'nullable|string|max:255',
            'design_style' => 'nullable|string|max:255',
            'fashion_style' => 'nullable|string|max:255',
            'description'  => 'nullable|string',
            'price'        => 'required|numeric|min:0',
            'size_details' => 'required|array',
            'categories'   => 'nullable|array',
            'categories.*' => 'integer|exists:categories,id',
            'image_urls'   => 'nullable|array',
            'image_urls.*' => 'string|url',
        ]);

        return DB::transaction(function () use ($validated, $user) {
            $product = Product::create([
                'shop_id'      => $user->shop->id,
                'name'         => $validated['name'],
                'brand'        => $validated['brand'] ?? null,
                'colors'       => $validated['colors'] ?? null,
                'material'     => $validated['material'] ?? null,
                'origin'       => $validated['origin'] ?? null,
                'design_style' => $validated['design_style'] ?? null,
                'fashion_style' => $validated['fashion_style'] ?? null,
                'description'  => $validated['description'] ?? null,
                'price'        => $validated['price'],
                'size_details' => $validated['size_details'],
            ]);

            if (!empty($validated['categories'])) {
                $product->categories()->attach($validated['categories']);
            }

            if (!empty($validated['image_urls'])) {
                $images = collect($validated['image_urls'])->map(function ($url, $index) {
                    return [
                        'url'          => $url,
                        'is_thumbnail' => $index === 0,
                    ];
                });

                $product->images()->createMany($images->toArray());
            }

            $this->syncVariantStocks($product, $validated['size_details']);
            $product->load(['categories', 'images', 'shop', 'shop.owner', 'variantStocks']);
            app(ProductVectorSyncService::class)->syncProduct($product);

            return response()->json($product, 201);
        });
    }

    public function show($id)
    {
        $product = Product::with([
            'categories',
            'images',
            'shop',
            'shop.owner',
            'variantStocks',
        ])->find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Sản phẩm không tồn tại'
            ], 404);
        }

        return response()->json($product, 200);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$this->checkOwnerRole($user)) {
            return response()->json([
                'message' => 'Bạn không có quyền sửa sản phẩm.'
            ], 403);
        }

        if (!$user->shop) {
            return response()->json([
                'message' => 'Tài khoản này chưa có cửa hàng.'
            ], 404);
        }

        $product = Product::where('id', $id)
            ->where('shop_id', $user->shop->id)
            ->first();

        if (!$product) {
            return response()->json([
                'message' => 'Không tìm thấy sản phẩm hoặc bạn không có quyền sửa sản phẩm này.'
            ], 404);
        }

        $validated = $request->validate([
            'name'         => 'sometimes|required|string|max:255',
            'brand'        => 'nullable|string|max:255',
            'colors'       => 'nullable|array',
            'colors.*'     => 'string|max:100',
            'material'     => 'nullable|string|max:255',
            'origin'       => 'nullable|string|max:255',
            'design_style' => 'nullable|string|max:255',
            'fashion_style' => 'nullable|string|max:255',
            'description'  => 'nullable|string',
            'price'        => 'sometimes|required|numeric|min:0',
            'size_details' => 'sometimes|required|array',
            'categories'   => 'nullable|array',
            'categories.*' => 'integer|exists:categories,id',
            'image_urls'   => 'nullable|array',
            'image_urls.*' => 'string|url',
        ]);

        return DB::transaction(function () use ($validated, $product) {
            $productData = collect($validated)
                ->except(['categories', 'image_urls'])
                ->toArray();

            $product->update($productData);

            if (isset($validated['categories'])) {
                $product->categories()->sync($validated['categories']);
            }

            if (isset($validated['size_details'])) {
                $this->syncVariantStocks($product, $validated['size_details']);
            }

            if (isset($validated['image_urls'])) {
                $product->images()->delete();

                $images = collect($validated['image_urls'])->map(function ($url, $index) {
                    return [
                        'url'          => $url,
                        'is_thumbnail' => $index === 0,
                    ];
                });

                $product->images()->createMany($images->toArray());
            }

            $product->load(['categories', 'images', 'shop', 'shop.owner', 'variantStocks']);
            app(ProductVectorSyncService::class)->syncProduct($product);

            return response()->json($product, 200);
        });
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$this->checkOwnerRole($user)) {
            return response()->json([
                'message' => 'Bạn không có quyền xóa sản phẩm.'
            ], 403);
        }

        if (!$user->shop) {
            return response()->json([
                'message' => 'Tài khoản này chưa có cửa hàng.'
            ], 404);
        }

        $product = Product::where('id', $id)
            ->where('shop_id', $user->shop->id)
            ->first();

        if (!$product) {
            return response()->json([
                'message' => 'Không tìm thấy sản phẩm hoặc bạn không có quyền xóa sản phẩm này.'
            ], 404);
        }

        return DB::transaction(function () use ($product) {
            $productId = (int) $product->id;
            $product->categories()->detach();
            $product->images()->delete();
            $product->delete();
            app(ProductVectorSyncService::class)->deleteProduct($productId);

            return response()->json([
                'message' => 'Đã xóa sản phẩm thành công'
            ], 200);
        });
    }

    private function syncVariantStocks(Product $product, array $sizeDetails): void
    {
        $rows = [];

        foreach ($sizeDetails as $colorOrSize => $value) {
            if (is_array($value)) {
                foreach ($value as $size => $quantity) {
                    $rows[] = [
                        'color' => $colorOrSize === 'Mặc định' || $colorOrSize === 'Mac dinh' ? null : $colorOrSize,
                        'size' => $size === 'Không size' || $size === 'Khong size' ? null : $size,
                        'quantity' => max(0, (int) $quantity),
                    ];
                }
            } else {
                $rows[] = [
                    'color' => null,
                    'size' => $colorOrSize === 'Không size' || $colorOrSize === 'Khong size' ? null : $colorOrSize,
                    'quantity' => max(0, (int) $value),
                ];
            }
        }

        $product->variantStocks()->delete();

        if (!empty($rows)) {
            $product->variantStocks()->createMany($rows);
        }
    }

    public function uploadImage(Request $request)
    {
        $user = $request->user();

        if (!$this->checkOwnerRole($user)) {
            return response()->json([
                'message' => 'Bạn không có quyền upload ảnh sản phẩm.'
            ], 403);
        }

        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $path = $request->file('image')->store('products', 'public');

        $url = asset('storage/' . $path);

        return response()->json([
            'message'   => 'Tải ảnh lên thành công',
            'image_url' => $url,
        ], 201);
    }
}
