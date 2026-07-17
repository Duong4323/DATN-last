<?php

namespace App\Http\Controllers\Api\Cart;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Cart;
use App\Models\Product;

class CartController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Vui long dang nhap.'], 401);
        }

        $cartItems = Cart::where('user_id', $user->id)
            ->with('product.images')
            ->get()
            ->map(function ($item) {
                return [
                    'id'            => $item->id,
                    'product_id'    => $item->product_id,
                    'name'          => $item->product->name,
                    'size'          => $item->size,
                    'color'         => $item->color,
                    'quantity'      => $item->quantity,
                    'price'         => (float) $item->product->price,
                    'thumbnail_url' => $item->product->thumbnail_url,
                    'total_price'   => (float) ($item->quantity * $item->product->price),
                    'max_stock'     => $this->getVariantStock($item->product, $item->size, $item->color),
                ];
            });

        return response()->json([
            'items' => $cartItems,
            'grand_total' => $cartItems->sum('total_price')
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity'   => 'required|integer|min:1',
            'size'       => 'nullable|string',
            'color'      => 'nullable|string',
        ]);

        $user = Auth::user();
        $product = Product::findOrFail($validated['product_id']);
        $size = $validated['size'];
        $color = $validated['color'] ?? null;
        $requestedQty = (int) $validated['quantity'];
        $stockAvailable = $this->getVariantStock($product, $size, $color);

        return DB::transaction(function () use ($user, $product, $size, $color, $requestedQty, $stockAvailable) {
            $cartItem = Cart::where('user_id', $user->id)
                ->where('product_id', $product->id)
                ->where('size', $size)
                ->where('color', $color)
                ->first();

            $targetQty = ($cartItem ? (int) $cartItem->quantity : 0) + $requestedQty;
            if ($stockAvailable < $targetQty) {
                $variantLabel = $color ? "$color / $size" : "Size $size";

                return response()->json([
                    'message' => "$variantLabel hien chi con $stockAvailable san pham."
                ], 422);
            }

            if ($cartItem) {
                $cartItem->quantity = $targetQty;
                $cartItem->save();
            } else {
                Cart::create([
                    'user_id'    => $user->id,
                    'product_id' => $product->id,
                    'size'       => $size,
                    'color'      => $color,
                    'quantity'   => $requestedQty,
                ]);
            }

            return $this->index();
        });
    }

    public function update(Request $request, $productId)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'size'     => 'nullable|string',
            'color'    => 'nullable|string',
        ]);

        $user = Auth::user();
        $size = $validated['size'];
        $color = $validated['color'] ?? null;
        $newQty = (int) $validated['quantity'];

        $cartItem = Cart::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->where('size', $size)
            ->where('color', $color)
            ->first();

        if (!$cartItem) {
            return response()->json(['message' => 'Mat hang khong ton tai trong gio.'], 404);
        }

        $product = Product::find($productId);
        if ($this->getVariantStock($product, $size, $color) < $newQty) {
            return response()->json(['message' => 'So luong vuot qua ton kho cho phep.'], 422);
        }

        $cartItem->update(['quantity' => $newQty]);

        return $this->index();
    }

    public function destroy(Request $request, $productId)
    {
        $user = Auth::user();
        $size = $request->query('size');
        $color = $request->query('color');

        $deleted = Cart::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->where('size', $size)
            ->where('color', $color)
            ->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Mat hang khong ton tai.'], 404);
        }

        return $this->index();
    }

    private function getVariantStock(?Product $product, ?string $size, ?string $color): int
    {
        if (!$product || !$product->size_details) {
            return 0;
        }

        $stock = $product->size_details;

        if (!$size) {
            if ($color && isset($stock[$color]) && is_array($stock[$color])) {
                return collect($stock[$color])->sum(fn ($qty) => (int) $qty);
            }

            return collect($stock)->sum(function ($value) {
                return is_array($value) ? collect($value)->sum(fn ($qty) => (int) $qty) : (int) $value;
            });
        }

        if ($color && isset($stock[$color]) && is_array($stock[$color])) {
            return (int) ($stock[$color][$size] ?? 0);
        }

        if (!$color && isset($stock[$size]) && !is_array($stock[$size])) {
            return (int) $stock[$size];
        }

        foreach ($stock as $colorStock) {
            if (is_array($colorStock) && isset($colorStock[$size])) {
                return (int) $colorStock[$size];
            }
        }

        return 0;
    }
}
