<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Products\ProductController;

Route::prefix('products')->group(function () {
    // Lấy danh sách sản phẩm
    Route::get('/', [ProductController::class, 'index']);

    // Thêm sản phẩm mới
    Route::post('/', [ProductController::class, 'store']);

    // Xem chi tiết sản phẩm theo ID
    Route::get('/{id}', [ProductController::class, 'show']);

    // Cập nhật thông tin sản phẩm
    Route::put('/{id}', [ProductController::class, 'update']);

    // Xóa sản phẩm
    Route::delete('/{id}', [ProductController::class, 'destroy']);
    Route::post('/upload-image', [ProductController::class, 'uploadImage']);
});
