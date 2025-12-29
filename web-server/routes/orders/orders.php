<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\orders\OrderController;

/*
|--------------------------------------------------------------------------
| Order Routes
|--------------------------------------------------------------------------
*/

// Nhóm route bảo vệ
Route::middleware('auth:sanctum')->group(function () {
    
    // Nhóm route dưới prefix /orders
    Route::prefix('orders')->group(function () {
        
        // GET: Lấy lịch sử đơn hàng
        Route::get('/', [OrderController::class, 'index']); 
        
        // POST: Tạo đơn hàng mới/Checkout
        Route::post('/', [OrderController::class, 'store']); 
        
        // POST: Người dùng hủy đơn hàng
        Route::post('/{orderId}/cancel', [OrderController::class, 'cancel']); 
        
        // SỬA LỖI: Đổi updateStatus thành updateOrder
        // PUT /api/orders/{orderId}/status (Admin cập nhật trạng thái & thanh toán)
        Route::put('/{orderId}/status', [OrderController::class, 'updateOrder']); 
    });
});