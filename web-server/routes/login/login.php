<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\Login\LoginController;

// Route đăng nhập
Route::prefix('auth')->group(function () {
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('register', [LoginController::class, 'register']);

    // Logout cần token hợp lệ (Sanctum)
    Route::middleware('auth:sanctum')->post('/logout', [LoginController::class, 'logout']);
});
