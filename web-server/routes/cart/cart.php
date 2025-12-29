<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\cart\CartController;
// Nhóm route này được bảo vệ, chỉ dành cho người dùng đã đăng nhập.
Route::middleware('auth:sanctum')->group(function () {
    
    // Đặt prefix 'cart' cho nhóm này
    Route::prefix('cart')->group(function () {
        
        // GET: Lấy nội dung giỏ hàng hiện tại
        Route::get('/', [CartController::class, 'index']);
        
        // POST: Thêm sản phẩm hoặc tăng số lượng
        Route::post('/', [CartController::class, 'store']); 
        
        // PUT: Cập nhật số lượng của một mục hàng
        // Tham số {productId} cần phải có trong URL
        Route::put('/{productId}', [CartController::class, 'update']); 
        
        // DELETE: Xóa mục hàng khỏi giỏ
        Route::delete('/{productId}', [CartController::class, 'destroy']);
    });
});