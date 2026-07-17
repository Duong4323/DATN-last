<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\orders\OrderController;

Route::prefix('orders')
    ->middleware('auth:sanctum')
    ->group(function () {

        // GET: Lấy lịch sử đơn hàng
        Route::get('/', [OrderController::class, 'index']);

        Route::get('/statistics', [OrderController::class, 'statistics']);

        // POST: Tạo đơn hàng mới
        Route::post('/', [OrderController::class, 'store']);

        // POST: Hủy đơn hàng
        Route::post('/{orderId}/cancel', [OrderController::class, 'cancel']);

        // POST: Trả hàng
        Route::post('/{orderId}/return', [OrderController::class, 'returnOrder']);

        // PUT: Admin cập nhật trạng thái
        Route::put('/{orderId}/status', [OrderController::class, 'updateOrder']);
    });
