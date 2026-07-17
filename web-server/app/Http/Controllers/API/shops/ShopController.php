<?php

namespace App\Http\Controllers\API\shops;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'shop_owner') {
            return response()->json([
                'message' => 'Chi chu cua hang moi co quyen xem thong tin cua hang.'
            ], 403);
        }

        if (!$user->shop) {
            return response()->json([
                'message' => 'Tai khoan nay chua co cua hang.'
            ], 404);
        }

        return response()->json($user->shop);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'shop_owner') {
            return response()->json([
                'message' => 'Chi chu cua hang moi co quyen cap nhat thong tin cua hang.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo_url' => 'nullable|url|max:2048',
            'description' => 'nullable|string|max:2000',
            'address' => 'required|string|max:500',
        ]);

        $shop = $user->shop()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'message' => 'Cap nhat thong tin cua hang thanh cong.',
            'shop' => $shop,
        ]);
    }
}
