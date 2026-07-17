<?php

namespace App\Http\Controllers\API\Products;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProductReview;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProductReviewController extends Controller
{
    /**
     * Gửi đánh giá mới
     */
    public function store(Request $request)
    {
        $request->validate([
            'order_id'   => 'required|integer',
            'product_id' => 'required|integer',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:500',
            'image'      => 'nullable|image|mimes:jpg,jpeg,png|max:2048'
        ]);

        $userId = Auth::id();

        // 1. Kiểm tra đơn hàng tồn tại và thuộc về User
        $order = Order::where('id', $request->order_id)
                      ->where('user_id', $userId)
                      ->first();

        if (!$order) {
            return response()->json([
                'message' => 'Đơn hàng không tồn tại hoặc không thuộc về bạn.',
                'debug' => ['user_id' => $userId, 'order_requested' => $request->order_id]
            ], 404);
        }

        // 2. Kiểm tra trạng thái giao hàng
        if (strtolower(trim($order->status)) !== 'delivered') {
            return response()->json([
                'message' => 'Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng được giao thành công.',
                'current_status' => $order->status
            ], 403);
        }

        // 3. Kiểm tra sản phẩm có trong nội dung đơn hàng (JSON order_details)
        $items = $order->order_details; 
        $productExists = collect($items)->contains('product_id', (int)$request->product_id);

        if (!$productExists) {
            return response()->json(['message' => 'Sản phẩm này không nằm trong đơn hàng này.'], 403);
        }

        // 4. Kiểm tra xem đã đánh giá chưa (Tránh spam)
        $alreadyReviewed = ProductReview::where('order_id', $request->order_id)
                                        ->where('product_id', $request->product_id)
                                        ->exists();
        if ($alreadyReviewed) {
            return response()->json(['message' => 'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi.'], 400);
        }

        // 5. Xử lý lưu ảnh
        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('reviews', 'public');
            $imageUrl = asset('storage/' . $path);
        }

        // 6. Lưu vào Database
        DB::beginTransaction();
        try {
            $review = ProductReview::create([
                'product_id' => $request->product_id,
                'user_id'    => $userId,
                'order_id'   => $request->order_id,
                'rating'     => $request->rating,
                'comment'    => $request->comment,
                'image_url'  => $imageUrl,
            ]);

            DB::commit();
            return response()->json(['message' => 'Đánh giá thành công!', 'review' => $review], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Lấy đánh giá của một sản phẩm
     */
    public function getProductReviews($id)
    {
        $reviews = ProductReview::with('user:id,name')
                                ->where('product_id', $id)
                                ->latest()
                                ->get();
        return response()->json($reviews);
    }
}