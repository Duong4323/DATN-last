<?php

namespace App\Http\Controllers\API\orders;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Order;
use App\Models\Product;
use App\Models\Cart;
use App\Models\ShopMonthlyStatistic;
use App\Services\ProductVectorSyncService;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private function statusMap()
    {
        return [
            'pending' => 'ChÆ°a xá»­ lÃ½',
            'confirmed' => 'ÄÃ£ xÃ¡c nháº­n',
            'shipping' => 'Äang giao',
            'delivered' => 'ÄÃ£ giao',
            'cancelled' => 'ÄÃ£ há»§y',
            'returned' => 'Tráº£ hÃ ng/HoÃ n tiá»n',
        ];
    }

    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = Order::with(['user', 'shop', 'details']);

        if ($user->role === 'shop_owner') {
            if (!$user->shop) {
                return response()->json([
                    'message' => 'TÃ i khoáº£n nÃ y chÆ°a cÃ³ cá»­a hÃ ng.'
                ], 404);
            }

            $query->where('shop_id', $user->shop->id);
        } elseif ($user->role === 'user') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'admin') {
            // Admin xem táº¥t cáº£ Ä‘Æ¡n hÃ ng
        } else {
            return response()->json([
                'message' => 'Báº¡n khÃ´ng cÃ³ quyá»n xem Ä‘Æ¡n hÃ ng.'
            ], 403);
        }

        $orders = $query->latest()->get();
        $statusMap = $this->statusMap();

        $formattedOrders = $orders->map(function ($order) use ($statusMap) {
            $orderDetails = $this->orderItems($order);

            $productsList = collect($orderDetails)->map(function ($item) {
                $colorLabel = !empty($item['color'])
                    ? ' (Mau: ' . $item['color'] . ')'
                    : '';
                $sizeLabel = !empty($item['size'])
                    ? ' (Size: ' . $item['size'] . ')'
                    : '';

                return $item['product_name'] . $colorLabel . $sizeLabel . ' x' . $item['quantity'];
            })->toArray();

            $itemsInfo = collect($orderDetails)->map(function ($item) {
                return [
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'color' => $item['color'] ?? null,
                    'size' => $item['size'] ?? null,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ];
            })->toArray();

            return [
                'id' => $order->id,
                'orderId' => 'ORD' . str_pad($order->id, 4, '0', STR_PAD_LEFT),

                'shop_id' => $order->shop_id,
                'shop_name' => $order->shop ? $order->shop->name : null,

                'buyerName' => $order->user ? $order->user->name : null,
                'customer_name' => $order->user ? $order->user->name : null,
                'customer_phone' => $order->user ? $order->user->phone_number : null,

                'totalAmount' => $order->total_amount,
                'date' => $order->created_at->format('Y-m-d H:i'),

                'orderStatus' => $statusMap[$order->status] ?? $order->status,
                'statusKey' => $order->status,

                'paymentStatusKey' => $order->payment_status,
                'payment_status' => $order->payment_status,

                'products' => $productsList,
                'items_info' => $itemsInfo,

                'shipping_address' => $order->shipping_address,
            ];
        });

        return response()->json($formattedOrders);
    }

    public function statistics(Request $request)
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'shop_owner') {
            return response()->json([
                'message' => 'Chi chu cua hang moi co quyen xem thong ke.'
            ], 403);
        }

        if (!$user->shop) {
            return response()->json([
                'message' => 'Tai khoan nay chua co cua hang.'
            ], 404);
        }

        $this->ensureShopStatistics($user->shop->id);

        $statistics = ShopMonthlyStatistic::where('shop_id', $user->shop->id)
            ->orderBy('month')
            ->get();

        $ordersByMonth = $statistics
            ->map(function (ShopMonthlyStatistic $statistic) {
                return [
                    'month' => $statistic->month,
                    'total_orders' => (int) $statistic->total_orders,
                    'pending_orders' => (int) $statistic->pending_orders,
                    'completed_orders' => (int) $statistic->completed_orders,
                    'revenue' => (float) $statistic->revenue,
                    'sold_products' => (int) $statistic->sold_products,
                ];
            })
            ->values();

        return response()->json([
            'revenue' => (float) $statistics->sum('revenue'),
            'sold_products' => (int) $statistics->sum('sold_products'),
            'pending_orders' => (int) $statistics->sum('pending_orders'),
            'completed_orders' => (int) $statistics->sum('completed_orders'),
            'total_orders' => (int) $statistics->sum('total_orders'),
            'orders_by_month' => $ordersByMonth,
        ]);
    }

    private function sumOrderQuantity(Order $order): int
    {
        $items = $this->orderItems($order);

        return collect($items)->sum(function ($item) {
            return (int) ($item['quantity'] ?? 0);
        });
    }

    private function orderItems(Order $order): array
    {
        if ($order->relationLoaded('details') && $order->details->isNotEmpty()) {
            return $order->details
                ->map(fn ($detail) => [
                    'product_id' => $detail->product_id,
                    'product_name' => $detail->product_name,
                    'color' => $detail->color,
                    'size' => $detail->size,
                    'quantity' => $detail->quantity,
                    'price' => $detail->price,
                ])
                ->toArray();
        }

        $items = is_string($order->order_details)
            ? json_decode($order->order_details, true)
            : $order->order_details;

        return is_array($items) ? $items : [];
    }

    private function isCompletedPaidOrder(Order $order): bool
    {
        return $order->status === 'delivered' && $order->payment_status === 'paid';
    }

    private function rebuildShopMonthlyStatistic(int $shopId, string $month): void
    {
        $orders = Order::where('shop_id', $shopId)
            ->whereRaw("to_char(created_at, 'YYYY-MM') = ?", [$month])
            ->get();

        $completedOrders = $orders->filter(function (Order $order) {
            return $this->isCompletedPaidOrder($order);
        });

        ShopMonthlyStatistic::updateOrCreate(
            [
                'shop_id' => $shopId,
                'month' => $month,
            ],
            [
                'total_orders' => $orders->count(),
                'pending_orders' => $orders->where('status', 'pending')->count(),
                'completed_orders' => $completedOrders->count(),
                'sold_products' => $completedOrders->sum(function (Order $order) {
                    return $this->sumOrderQuantity($order);
                }),
                'revenue' => $completedOrders->sum('total_amount'),
            ]
        );
    }

    private function rebuildStatisticForOrder(Order $order): void
    {
        if (!$order->shop_id || !$order->created_at) {
            return;
        }

        $this->rebuildShopMonthlyStatistic(
            (int) $order->shop_id,
            $order->created_at->format('Y-m')
        );
    }

    private function ensureShopStatistics(int $shopId): void
    {
        $months = Order::where('shop_id', $shopId)
            ->selectRaw("distinct to_char(created_at, 'YYYY-MM') as month")
            ->pluck('month');

        foreach ($months as $month) {
            if (!ShopMonthlyStatistic::where('shop_id', $shopId)->where('month', $month)->exists()) {
                $this->rebuildShopMonthlyStatistic($shopId, $month);
            }
        }
    }

    public function store(Request $request)
    {
        $userId = Auth::id();

        if (!$userId) {
            return response()->json([
                'error' => 'Vui lÃ²ng Ä‘Äƒng nháº­p.'
            ], 401);
        }

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'items.*.product_name' => 'required|string',
            'items.*.color' => 'nullable|string',
            'items.*.size' => 'nullable|string',
            'total_amount' => 'required|numeric',
            'shipping_address' => 'required|string|max:500',
            'payment_method' => ['required', Rule::in(['cod', 'transfer'])],
            'payment_status' => ['required', Rule::in(['unpaid', 'paid', 'refunded'])],
        ]);

        return DB::transaction(function () use ($request, $userId) {
            $itemsGroupedByShop = [];
            $checkedItems = [];
            $insufficientItems = [];

            foreach ($request->items as $item) {
                $product = Product::lockForUpdate()->find($item['product_id']);

                if (!$product) {
                    $insufficientItems[] = [
                        'product_id' => (int) $item['product_id'],
                        'product_name' => $item['product_name'] ?? 'San pham',
                        'color' => $item['color'] ?? null,
                        'size' => $item['size'] ?? null,
                        'requested_quantity' => (int) ($item['quantity'] ?? 0),
                        'remaining_quantity' => 0,
                        'message' => 'San pham khong ton tai hoac da bi xoa.',
                    ];

                    continue;
                }

                $size = $item['size'] ?? null;
                $color = $item['color'] ?? null;
                $orderQty = (int) $item['quantity'];
                $sizeDetails = $product->size_details;
                $stock = $this->getVariantStock($sizeDetails, $size, $color);

                if ($stock < $orderQty) {
                    $variantLabel = trim(($color ? "Mau {$color} - " : '') . ($size ? "Size {$size}" : 'Khong size'));
                    $insufficientItems[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'color' => $color,
                        'size' => $size,
                        'variant_label' => $variantLabel,
                        'requested_quantity' => $orderQty,
                        'remaining_quantity' => $stock,
                        'message' => "San pham {$product->name} - {$variantLabel} chi con {$stock} san pham.",
                    ];

                    continue;
                }

                $checkedItems[] = [
                    'product' => $product,
                    'item' => $item,
                    'size' => $size,
                    'color' => $color,
                    'orderQty' => $orderQty,
                    'sizeDetails' => $sizeDetails,
                ];
            }

            if (!empty($insufficientItems)) {
                return response()->json([
                    'message' => 'Mot so san pham trong gio hang khong con du so luong.',
                    'insufficient_items' => $insufficientItems,
                ], 422);
            }

            foreach ($checkedItems as $checkedItem) {
                /** @var Product $product */
                $product = $checkedItem['product'];
                $item = $checkedItem['item'];
                $size = $checkedItem['size'];
                $color = $checkedItem['color'];
                $orderQty = $checkedItem['orderQty'];
                $sizeDetails = $checkedItem['sizeDetails'];

                $sizeDetails = $this->decrementVariantStock($sizeDetails, $size, $color, $orderQty);

                $product->size_details = $sizeDetails;
                $product->sold += $orderQty;
                $product->save();
                $this->syncProductVariantStocks($product, $sizeDetails);
                app(ProductVectorSyncService::class)->syncProduct($product);

                $shopId = $product->shop_id;

                if (!isset($itemsGroupedByShop[$shopId])) {
                    $itemsGroupedByShop[$shopId] = [];
                }

                $itemsGroupedByShop[$shopId][] = [
                    'product_id' => (int) $item['product_id'],
                    'quantity' => $orderQty,
                    'price' => round((float) $item['price']),
                    'product_name' => $item['product_name'],
                    'color' => $color,
                    'size' => $size,
                ];
            }

            $createdOrders = [];

            foreach ($itemsGroupedByShop as $shopId => $items) {
                $shopTotal = collect($items)->sum(function ($item) {
                    return $item['price'] * $item['quantity'];
                });

                $order = Order::create([
                    'user_id' => $userId,
                    'shop_id' => $shopId,
                    'total_amount' => $shopTotal,
                    'order_details' => $items,
                    'shipping_address' => $request->shipping_address,
                    'status' => 'pending',
                    'payment_status' => $request->payment_status,
                ]);

                $order->details()->createMany($items);

                $createdOrders[] = [
                    'orderId' => 'ORD' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                    'order_id_db' => $order->id,
                    'shop_id' => $shopId,
                    'total_amount' => $shopTotal,
                ];

                $this->rebuildStatisticForOrder($order);
            }

            Cart::where('user_id', $userId)->delete();

            return response()->json([
                'message' => 'ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c táº¡o thÃ nh cÃ´ng!',
                'orders' => $createdOrders,
            ], 201);
        });
    }

    private function getVariantStock(?array $sizeDetails, ?string $size, ?string $color): int
    {
        if (!$sizeDetails) {
            return 0;
        }

        if (!$size) {
            if ($color && isset($sizeDetails[$color]) && is_array($sizeDetails[$color])) {
                return collect($sizeDetails[$color])->sum(fn ($qty) => (int) $qty);
            }

            return collect($sizeDetails)->sum(function ($value) {
                return is_array($value) ? collect($value)->sum(fn ($qty) => (int) $qty) : (int) $value;
            });
        }

        if ($color && isset($sizeDetails[$color]) && is_array($sizeDetails[$color])) {
            return (int) ($sizeDetails[$color][$size] ?? 0);
        }

        if (isset($sizeDetails[$size]) && !is_array($sizeDetails[$size])) {
            return (int) $sizeDetails[$size];
        }

        if (!$color) {
            foreach ($sizeDetails as $sizes) {
                if (is_array($sizes) && isset($sizes[$size])) {
                    return (int) $sizes[$size];
                }
            }
        }

        return 0;
    }

    private function decrementVariantStock(?array $sizeDetails, ?string $size, ?string $color, int $quantity): array
    {
        $sizeDetails = $sizeDetails ?? [];

        if (!$size) {
            if ($color) {
                if (!isset($sizeDetails[$color]) || !is_array($sizeDetails[$color])) {
                    $sizeDetails[$color] = [];
                }

                $currentKey = array_key_first($sizeDetails[$color]) ?: 'Khong size';
                $sizeDetails[$color][$currentKey] = max(0, (int) ($sizeDetails[$color][$currentKey] ?? 0) - $quantity);
                return $sizeDetails;
            }

            foreach ($sizeDetails as $stockKey => $stockQty) {
                if (!is_array($stockQty)) {
                    $sizeDetails[$stockKey] = max(0, (int) $stockQty - $quantity);
                    return $sizeDetails;
                }
            }
        }

        if ($color && isset($sizeDetails[$color]) && is_array($sizeDetails[$color])) {
            $sizeDetails[$color][$size] = max(0, (int) ($sizeDetails[$color][$size] ?? 0) - $quantity);
            return $sizeDetails;
        }

        if (isset($sizeDetails[$size]) && !is_array($sizeDetails[$size])) {
            $sizeDetails[$size] = max(0, (int) $sizeDetails[$size] - $quantity);
            return $sizeDetails;
        }

        if (!$color) {
            foreach ($sizeDetails as $stockColor => $sizes) {
                if (is_array($sizes) && isset($sizes[$size])) {
                    $sizeDetails[$stockColor][$size] = max(0, (int) $sizes[$size] - $quantity);
                    return $sizeDetails;
                }
            }
        }

        return $sizeDetails;
    }

    private function incrementVariantStock(?array $sizeDetails, ?string $size, ?string $color, int $quantity): array
    {
        $sizeDetails = $sizeDetails ?? [];

        if (!$size) {
            if ($color) {
                if (!isset($sizeDetails[$color]) || !is_array($sizeDetails[$color])) {
                    $sizeDetails[$color] = [];
                }

                $currentKey = array_key_first($sizeDetails[$color]) ?: 'Khong size';
                $sizeDetails[$color][$currentKey] = (int) ($sizeDetails[$color][$currentKey] ?? 0) + $quantity;
                return $sizeDetails;
            }

            $currentKey = 'Khong size';
            foreach ($sizeDetails as $stockKey => $stockQty) {
                if (!is_array($stockQty)) {
                    $currentKey = $stockKey;
                    break;
                }
            }
            $sizeDetails[$currentKey] = (int) ($sizeDetails[$currentKey] ?? 0) + $quantity;
            return $sizeDetails;
        }

        if ($color) {
            if (!isset($sizeDetails[$color]) || !is_array($sizeDetails[$color])) {
                $sizeDetails[$color] = [];
            }

            $sizeDetails[$color][$size] = (int) ($sizeDetails[$color][$size] ?? 0) + $quantity;
            return $sizeDetails;
        }

        if (isset($sizeDetails[$size]) && !is_array($sizeDetails[$size])) {
            $sizeDetails[$size] = (int) $sizeDetails[$size] + $quantity;
            return $sizeDetails;
        }

        foreach ($sizeDetails as $stockColor => $sizes) {
            if (is_array($sizes) && isset($sizes[$size])) {
                $sizeDetails[$stockColor][$size] = (int) $sizes[$size] + $quantity;
                return $sizeDetails;
            }
        }

        $sizeDetails[$size] = $quantity;
        return $sizeDetails;
    }

    private function syncProductVariantStocks(Product $product, array $sizeDetails): void
    {
        $rows = [];

        foreach ($sizeDetails as $colorOrSize => $value) {
            if (is_array($value)) {
                foreach ($value as $size => $quantity) {
                    $rows[] = [
                        'color' => $this->isDefaultColorLabel($colorOrSize) ? null : $colorOrSize,
                        'size' => $this->isNoSizeLabel($size) ? null : $size,
                        'quantity' => max(0, (int) $quantity),
                    ];
                }
                continue;
            }

            $rows[] = [
                'color' => null,
                'size' => $this->isNoSizeLabel($colorOrSize) ? null : $colorOrSize,
                'quantity' => max(0, (int) $value),
            ];
        }

        $product->variantStocks()->delete();

        if (!empty($rows)) {
            $product->variantStocks()->createMany($rows);
        }
    }

    private function isDefaultColorLabel(?string $value): bool
    {
        $normalized = strtolower(trim((string) $value));

        return $normalized === 'mac dinh';
    }

    private function isNoSizeLabel(?string $value): bool
    {
        $normalized = strtolower(trim((string) $value));

        return $normalized === 'khong size'
            || ($normalized !== 'free size' && str_ends_with($normalized, ' size'));
    }

    private function restoreOrderInventory(Order $order): void
    {
        $items = $this->orderItems($order);

        foreach ($items ?? [] as $item) {
            $product = Product::lockForUpdate()->find($item['product_id'] ?? null);

            if (!$product) {
                continue;
            }

            $quantity = (int) ($item['quantity'] ?? 0);
            $size = $item['size'] ?? null;
            $color = $item['color'] ?? null;

            if ($quantity <= 0) {
                continue;
            }

            $sizeDetails = $this->incrementVariantStock($product->size_details, $size, $color, $quantity);
            $product->size_details = $sizeDetails;
            $product->sold = max(0, (int) $product->sold - $quantity);
            $product->save();
            $this->syncProductVariantStocks($product, $sizeDetails);
            app(ProductVectorSyncService::class)->syncProduct($product);
        }
    }

    public function updateOrder(Request $request, $orderId)
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'shop_owner') {
            return response()->json([
                'message' => 'Chá»‰ chá»§ cá»­a hÃ ng má»›i cÃ³ quyá»n cáº­p nháº­t Ä‘Æ¡n hÃ ng.'
            ], 403);
        }

        if (!$user->shop) {
            return response()->json([
                'message' => 'TÃ i khoáº£n nÃ y chÆ°a cÃ³ cá»­a hÃ ng.'
            ], 404);
        }

        $request->validate([
            'status' => [
                'nullable',
                Rule::in([
                    'pending',
                    'confirmed',
                    'shipping',
                    'delivered',
                    'cancelled',
                    'returned',
                ]),
            ],
            'payment_status' => [
                'nullable',
                Rule::in([
                    'unpaid',
                    'paid',
                    'refunded',
                ]),
            ],
        ]);

        $order = Order::where('id', $orderId)
            ->where('shop_id', $user->shop->id)
            ->first();

        if (!$order) {
            return response()->json([
                'message' => 'KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng thuá»™c cá»­a hÃ ng cá»§a báº¡n.'
            ], 404);
        }

        if (in_array($order->status, ['cancelled', 'delivered'], true)) {
            return response()->json([
                'message' => 'Don hang da huy hoac da giao nen khong the thay doi trang thai.'
            ], 422);
        }

        if ($request->has('status') && $request->status === 'cancelled' && $order->status !== 'cancelled') {
            $this->restoreOrderInventory($order);
        }

        if ($request->has('status')) {
            $order->status = $request->status;
        }

        if ($request->has('payment_status')) {
            $order->payment_status = $request->payment_status;
        }

        $order->save();
        $this->rebuildStatisticForOrder($order);

        return response()->json([
            'message' => 'Cáº­p nháº­t Ä‘Æ¡n hÃ ng thÃ nh cÃ´ng.',
            'order' => $order,
            'statusKey' => $order->status,
            'paymentStatusKey' => $order->payment_status,
        ], 200);
    }

    public function returnOrder($orderId)
    {
        $userId = Auth::id();

        $order = Order::where('id', $orderId)
            ->where('user_id', $userId)
            ->first();

        if (!$order) {
            return response()->json([
                'message' => 'KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng.'
            ], 404);
        }

        if ($order->status !== 'delivered') {
            return response()->json([
                'message' => 'Chá»‰ cÃ³ thá»ƒ tráº£ hÃ ng khi Ä‘Æ¡n hÃ ng Ä‘Ã£ giao thÃ nh cÃ´ng.'
            ], 400);
        }

        $order->status = 'returned';
        $order->payment_status = 'refunded';
        $order->save();
        $this->rebuildStatisticForOrder($order);

        return response()->json([
            'message' => 'YÃªu cáº§u tráº£ hÃ ng thÃ nh cÃ´ng!'
        ], 200);
    }

    public function cancel($orderId)
    {
        $userId = Auth::id();

        $order = Order::where('id', $orderId)
            ->where('user_id', $userId)
            ->first();

        if (!$order) {
            return response()->json([
                'message' => 'KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng.'
            ], 404);
        }

        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json([
                'message' => 'KhÃ´ng thá»ƒ há»§y Ä‘Æ¡n hÃ ng khi Ä‘Æ¡n Ä‘ang giao hoáº·c Ä‘Ã£ hoÃ n táº¥t.'
            ], 403);
        }

        $this->restoreOrderInventory($order);

        $order->status = 'cancelled';
        $order->save();
        $this->rebuildStatisticForOrder($order);

        return response()->json([
            'message' => 'ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c há»§y thÃ nh cÃ´ng.'
        ], 200);
    }
}
