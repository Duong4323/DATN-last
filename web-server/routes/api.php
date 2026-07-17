<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Route mặc định Laravel
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Include route login
require __DIR__ . '/login/login.php';
require __DIR__.'/user/user.php';
require __DIR__ . '/product/product.php';
require __DIR__ . '/shop/shop.php';
require __DIR__ . '/cart/cart.php';
require __DIR__ . '/orders/orders.php';
