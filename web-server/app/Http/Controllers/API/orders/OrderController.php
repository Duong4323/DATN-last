<?php

namespace App\Http\Controllers\API\orders;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Order;
use Illuminate\Validation\Rule;
use App\Models\User; 
use App\Models\Cart;

class OrderController extends Controller
{
    /**
     * Lấy danh sách tất cả đơn hàng (Admin) hoặc lịch sử đơn hàng của người dùng hiện tại (User).
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Kiểm tra xem người dùng có tồn tại không
        if (!$user) {
            return response()->json(['message' => 'Bạn cần đăng nhập để xem lịch sử đơn hàng.'], 401); 
        }

        // --- LOGIC SỬA LỖI: CHO PHÉP ADMIN XEM TẤT CẢ ĐƠN HÀNG ---
        $query = Order::with(['user']);

        // Nếu người dùng KHÔNG phải là admin, chỉ lấy đơn hàng của họ.
        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }
        
        $orders = $query->latest()->get();
        // --------------------------------------------------------

        // Định nghĩa bản đồ dịch trạng thái
        $statusMap = [
            'pending' => 'Chưa xử lý', 'confirmed' => 'Đã xác nhận',
            'shipping' => 'Đang giao', 'delivered' => 'Đã giao',
            'cancelled' => 'Đã hủy',
        ];
        $paymentMap = [
            'unpaid' => 'Chưa thanh toán', 'paid' => 'Đã thanh toán',
            'refunded' => 'Đã hoàn tiền',
        ];
        
        // Chuẩn hóa dữ liệu trả về
        $formattedOrders = $orders->map(function ($order) use ($statusMap, $paymentMap) {
            
            // Giải mã order_details (Giả định order_details là JSON trong DB)
            $orderDetails = is_string($order->order_details) ? json_decode($order->order_details, true) : $order->order_details;

            $productsList = collect($orderDetails)->map(function ($item) {
                return $item['product_name'] . ' (x' . $item['quantity'] . ')';
            })->toArray();
            
            return [
                'id' => $order->id,
                'orderId' => 'ORD' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'buyerName' => $order->user->name ?? 'Người dùng không tồn tại',
                'totalAmount' => $order->total_amount,
                'date' => $order->created_at->format('Y-m-d H:i'),
                
                'orderStatus' => $statusMap[$order->status] ?? $order->status,
                'paymentStatus' => $paymentMap[$order->payment_status] ?? $order->payment_status,
                
                'products' => $productsList,
                'statusKey' => $order->status,
                // 💡 ĐÃ SỬA LỖI: BỔ SUNG paymentStatusKey
                'paymentStatusKey' => $order->payment_status, 
            ];
        });


        return response()->json($formattedOrders);
    }

    /**
     * TẠO ĐƠN HÀNG MỚI từ giỏ hàng (Thực hiện quá trình checkout).
     */
    public function store(Request $request)
    {
        // 1. Lấy ID người dùng đã xác thực
        $userId = Auth::id();

        if (!$userId) {
             // Trả về 401 nếu Auth::id() là NULL 
             return response()->json(['error' => 'Vui lòng đăng nhập để tạo đơn hàng.'], 401);
        }

        // 2. Validate input
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0', 
            'items.*.product_name' => 'required|string',
            'total_amount' => 'required|numeric|min:0', 
            'shipping_address' => 'required|string|max:500', 
            'payment_method' => ['required', Rule::in(['cod', 'transfer'])],
            // Sử dụng payment_status như đã thống nhất trong các bước trước
            'payment_status' => ['required', Rule::in(['unpaid', 'paid', 'refunded'])], 
        ]);
        
        // 3. Chuẩn bị dữ liệu và ép kiểu cho Database
        $totalAmount = round((float) $request->total_amount); 
        
        $itemsForDb = collect($request->items)->map(function ($item) {
            return [
                'product_id' => (int) $item['product_id'],
                'quantity' => (int) $item['quantity'],
                'price' => round((float) $item['price']), 
                'product_name' => $item['product_name'],
            ];
        });

        // 4. Tạo đơn hàng
        $order = Order::create([
            'user_id' => $userId, 
            'total_amount' => $totalAmount, 
            'order_details' => $itemsForDb, 
            'shipping_address' => $request->shipping_address,
            'status' => 'pending', 
            'payment_status' => $request->payment_status,
        ]);
        
        // 5. Xóa giỏ hàng (Commented out)
        /*
        try {
            if (class_exists(Cart::class)) {
                Cart::where('user_id', $userId)->delete();
            }
        } catch (\Exception $e) {
             // Log lỗi và tiếp tục
        }
        */

        // 6. Trả về phản hồi
        return response()->json([
            'message' => 'Đơn hàng đã được tạo thành công!',
            'orderId' => 'ORD' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
            'order_id_db' => $order->id,
        ], 201);
    }

    /**
     * Người dùng hủy đơn hàng.
     */
    public function cancel($orderId)
    {
        $userId = Auth::id();

        $order = Order::where('id', $orderId)
                      ->where('user_id', $userId)
                      ->first();

        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng hoặc bạn không có quyền.'], 404);
        }
        
        $statusKey = $order->status;
        
        $cancellationMap = [
            'pending' => 'Chưa xử lý', 'confirmed' => 'Đã xác nhận',
            'shipping' => 'Đang giao', 
        ];
        $statusVietnamese = $cancellationMap[$statusKey] ?? $statusKey;

        if ($statusKey !== 'pending' && $statusKey !== 'confirmed') {
            return response()->json([
                'message' => 'Không thể hủy đơn hàng này. Đơn hàng đang ở trạng thái: ' . $statusVietnamese
            ], 403);
        }

        $order->status = 'cancelled';
        $order->save();

        return response()->json(['message' => 'Đơn hàng đã được hủy thành công.'], 200);
    }
    
    /**
     * Admin cập nhật trạng thái đơn hàng (status) và/hoặc trạng thái thanh toán (payment_status).
     * @param Request $request Chứa 'status' và/hoặc 'payment_status'.
     */
    public function updateOrder(Request $request, $orderId)
    {
        // Đã có kiểm tra role admin trong route group, nhưng giữ lại để bảo vệ lớp thứ hai
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Bạn không có quyền truy cập chức năng này.'], 403);
        }

        $request->validate([
            // Yêu cầu ít nhất 1 trong 2 trường phải có mặt
            'status' => ['nullable', Rule::in(['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'])],
            'payment_status' => ['nullable', Rule::in(['unpaid', 'paid', 'refunded'])],
        ]);

        // Yêu cầu phải có ít nhất một trường để cập nhật
        if (!$request->has('status') && !$request->has('payment_status')) {
             return response()->json(['message' => 'Phải cung cấp ít nhất một trạng thái (status hoặc payment_status) để cập nhật.'], 400);
        }
        
        $order = Order::find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng.'], 404);
        }

        // Cập nhật trạng thái đơn hàng (nếu có)
        if ($request->has('status')) {
            $order->status = $request->status;
        }
        
        // Cập nhật trạng thái thanh toán (nếu có)
        if ($request->has('payment_status')) {
             $order->payment_status = $request->payment_status;
        }

        $order->save();

        return response()->json(['message' => 'Đơn hàng đã được cập nhật thành công.', 'order' => $order], 200);
    }
}