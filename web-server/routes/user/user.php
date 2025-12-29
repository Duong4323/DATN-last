<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\users\UserController;

/*
|--------------------------------------------------------------------------
| User Routes (Điều chỉnh lại Cấu trúc)
|--------------------------------------------------------------------------
|
| Tách các route công khai và các route yêu cầu xác thực.
|
*/

Route::prefix('users')->group(function () {
    
    // 1. ROUTE CÔNG KHAI / KHÔNG CẦN XÁC THỰC HOẶC XÁC THỰC RIÊNG
    Route::post('/', [UserController::class, 'store']); // Đăng ký (Public)

    // 2. NHÓM ROUTE YÊU CẦU XÁC THỰC (auth:sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/profile-image', [UserController::class, 'getProfileImageUrl']);
        Route::post('/upload-profile-image', [UserController::class, 'uploadProfileImage']);

        // CRUD còn lại
        Route::get('/', [UserController::class, 'index']);      // Admin/Auth
        Route::get('/{id}', [UserController::class, 'show']);   // Auth
        Route::put('/{id}', [UserController::class, 'update']); // Auth
        Route::delete('/{id}', [UserController::class, 'destroy']); // Admin
        
    });
});