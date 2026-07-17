<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Products\ProductController;
use App\Http\Controllers\Api\Products\ProductAdvisorController;
use App\Http\Controllers\Api\Products\ProductReviewController;
use App\Http\Controllers\Api\Products\CategoryController;

/*
|--------------------------------------------------------------------------
| PUBLIC API
|--------------------------------------------------------------------------
| Ai cũng xem được
|--------------------------------------------------------------------------
*/

// Danh sách sản phẩm
Route::get('/products', [ProductController::class, 'index']);
Route::get('/categories', [CategoryController::class, 'index']);

// Chi tiết sản phẩm
Route::get('/products/{id}', [ProductController::class, 'show']);

// Chatbot tu van san pham dua tren catalog hien co
Route::post('/chatbot/product-advice', [ProductAdvisorController::class, 'advise']);

// Danh sách review
Route::get('/products/{id}/reviews', [
    ProductReviewController::class,
    'getProductReviews'
]);


/*
|--------------------------------------------------------------------------
| REVIEW API
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // Thêm review
    Route::post('/products/reviews', [
        ProductReviewController::class,
        'store'
    ]);
});
