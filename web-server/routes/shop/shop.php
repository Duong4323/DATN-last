<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Products\ProductController;
use App\Http\Controllers\API\shops\ShopController;

Route::middleware('auth:sanctum')->prefix('shop')->group(function () {
    Route::get('/profile', [
        ShopController::class,
        'show',
    ]);

    Route::put('/profile', [
        ShopController::class,
        'update',
    ]);

    Route::get('/products', [
        ProductController::class,
        'myProducts',
    ]);

    Route::post('/products', [
        ProductController::class,
        'store',
    ]);

    Route::put('/products/{id}', [
        ProductController::class,
        'update',
    ]);

    Route::delete('/products/{id}', [
        ProductController::class,
        'destroy',
    ]);

    Route::post('/products/upload-image', [
        ProductController::class,
        'uploadImage',
    ]);
});
