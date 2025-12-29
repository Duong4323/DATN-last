<?php

namespace App\Http\Controllers\Api\Cart;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Cart;

class CartController extends Controller
{
    public function __construct()
    {
        // $this->middleware('auth:sanctum');
    }

    /**
     * Lấy giỏ hàng hiện tại
     */
    public function index()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Vui lòng đăng nhập để xem giỏ hàng.'], 401);
        }

        // Lấy product từ quan hệ many-to-many
        $cartItems = $user->productsInCart->map(function ($product) {
            return [
                'product_id'    => $product->id,
                'name'          => $product->name,
                'quantity'      => $product->pivot->quantity,
                'price'         => $product->price,
                'thumbnail_url' => $product->thumbnail_url,
            ];
        });

        return response()->json($cartItems, 200);
    }

    /**
     * Thêm vào giỏ hàng
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity'   => 'required|integer|min:1',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Vui lòng đăng nhập để sử dụng giỏ hàng.'], 401);
        }

        $productId = $validated['product_id'];
        $quantity  = $validated['quantity'];

        $existing = Cart::where('user_id', $user->id)
                        ->where('product_id', $productId)
                        ->first();

        if ($existing) {
            $existing->quantity += $quantity;
            $existing->save();
        } else {
            Cart::create([
                'user_id'    => $user->id,
                'product_id' => $productId,
                'quantity'   => $quantity,
            ]);
        }

        return $this->index();
    }

    /**
     * Cập nhật số lượng
     */
    public function update(Request $request, $productId)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Vui lòng đăng nhập.'], 401);
        }

        $cartItem = Cart::where('user_id', $user->id)
                        ->where('product_id', $productId)
                        ->first();

        if (!$cartItem) {
            return response()->json(['message' => 'Mặt hàng không tồn tại trong giỏ hàng.'], 404);
        }

        $cartItem->quantity = $validated['quantity'];
        $cartItem->save();

        return $this->index();
    }

    /**
     * Xóa sản phẩm khỏi giỏ
     */
    public function destroy($productId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Vui lòng đăng nhập.'], 401);
        }

        $deleted = Cart::where('user_id', $user->id)
                       ->where('product_id', $productId)
                       ->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Mặt hàng không tồn tại trong giỏ.'], 404);
        }

        return $this->index();
    }
}
