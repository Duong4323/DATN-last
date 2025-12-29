<?php

namespace App\Http\Controllers\API\users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
// use Laravel\Socialite\Facades\Socialite; // Đã loại bỏ

class AuthenticateController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Thông tin đăng nhập không hợp lệ'], 401);
        }

        // Đảm bảo trả về trường 'profile_image_url' nếu có
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
                'name' => $user->name,
                // THÊM TRƯỜNG ẢNH PROFILE
                'profile_image_url' => $user->profile_image_url, 
            ],
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => config('sanctum.expiration', 1440),
        ]);
    }
    
    // Đã loại bỏ các phương thức microsoftRedirect và microsoftCallback
}