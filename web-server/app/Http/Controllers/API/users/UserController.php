<?php

namespace App\Http\Controllers\API\users;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * GET /api/users
     */
    public function index()
    {
        $users = User::with('shop')->get();

        return response()->json($users);
    }

    /**
     * POST /api/users
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'phone_number' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'profile_image_url' => 'nullable|url|max:2048',
            'password' => 'required|string|min:6',
            'role' => 'sometimes|string|in:admin,user,shop_owner',

            'shop_name' => 'required_if:role,shop_owner|nullable|string|max:255',
            'shop_logo_url' => 'nullable|url|max:2048',
            'shop_description' => 'nullable|string',
            'shop_address' => 'required_if:role,shop_owner|nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'username' => $request->username,
                'phone_number' => $request->phone_number,
                'address' => $request->address,
                'profile_image_url' => $request->profile_image_url,
                'password' => Hash::make($request->password),
                'role' => $request->role ?? 'user',
            ]);

            if ($user->role === 'shop_owner') {
                Shop::create([
                    'user_id' => $user->id,
                    'name' => $request->shop_name,
                    'logo_url' => $request->shop_logo_url,
                    'description' => $request->shop_description,
                    'address' => $request->shop_address,
                ]);
            }

            return response()->json([
                'message' => 'Thêm người dùng thành công!',
                'user' => $user->load('shop'),
            ], 201);
        });
    }

    /**
     * GET /api/users/{id}
     */
    public function show($id)
    {
        $user = User::with('shop')->find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Không tìm thấy người dùng!'
            ], 404);
        }

        return response()->json($user);
    }

    /**
     * PUT /api/users/{id}
     */
    public function update(Request $request, $id)
    {
        $user = User::with('shop')->find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Không tìm thấy người dùng!'
            ], 404);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',

            'username' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('users')->ignore($id),
            ],

            'phone_number' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'profile_image_url' => 'nullable|url|max:2048',
            'password' => 'nullable|string|min:6|confirmed',
            'role' => 'sometimes|string|in:admin,user,shop_owner',

            'shop_name' => 'nullable|string|max:255',
            'shop_logo_url' => 'nullable|url|max:2048',
            'shop_description' => 'nullable|string',
            'shop_address' => 'required_if:role,shop_owner|nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($request, $user) {
            $updateData = $request->only([
                'name',
                'username',
                'phone_number',
                'address',
                'profile_image_url',
                'role',
            ]);

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            if ($user->role === 'shop_owner') {
                $user->shop()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'name' => $request->shop_name ?? optional($user->shop)->name ?? $user->name,
                        'logo_url' => $request->shop_logo_url ?? optional($user->shop)->logo_url,
                        'description' => $request->shop_description ?? optional($user->shop)->description,
                        'address' => $request->shop_address ?? optional($user->shop)->address,
                    ]
                );
            }

            return response()->json([
                'message' => 'Cập nhật người dùng thành công!',
                'user' => $user->fresh('shop'),
            ]);
        });
    }

    /**
     * DELETE /api/users/{id}
     */
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Không tìm thấy người dùng!'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'message' => 'Xóa người dùng thành công!'
        ]);
    }

    /**
     * POST /api/users/upload-profile-image
     */
    public function uploadProfileImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if (!$request->hasFile('image')) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tệp ảnh.'
            ], 400);
        }

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Yêu cầu cần xác thực.'
            ], 401);
        }

        $file = $request->file('image');

        $path = 'profile_images/' . $user->id;

        $fileName = time() . '_' . $file->getClientOriginalName();

        $filePath = $file->storeAs(
            $path,
            $fileName,
            'public'
        );

        if (!$filePath) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lưu trữ tệp tin.'
            ], 500);
        }

        $url = Storage::url($filePath);

        $user->update([
            'profile_image_url' => url($url),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tải ảnh lên thành công.',
            'url' => url($url),
        ], 200);
    }

    /**
     * GET /api/users/profile-image
     */
    public function getProfileImageUrl(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Yêu cầu cần xác thực.'
            ], 401);
        }

        return response()->json([
            'profile_image_url' => $user->profile_image_url,
        ]);
    }
}