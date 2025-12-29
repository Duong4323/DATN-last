<?php

namespace App\Http\Controllers\API\users;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\Controller;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage; // Đã thêm
use Illuminate\Contracts\Filesystem\FilesystemAdapter;
class UserController extends Controller
{
    /**
     * Hiển thị danh sách tất cả người dùng (Admin only)
     * GET /api/users
     */
    public function index()
    {
        // 💡 LƯU Ý: Endpoint này nên được bảo vệ bằng middleware 'can:admin'
        $users = User::all();
        return response()->json($users);
    }

    /**
     * Thêm người dùng mới (Đăng ký/Admin thêm)
     * POST /api/users
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'phone_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'profile_image_url' => 'nullable|url|max:2048', 
            'password' => 'required|string|min:6',
            'role' => 'sometimes|string|in:admin,user',
        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'profile_image_url' => $request->profile_image_url,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'user',
        ]);

        return response()->json([
            'message' => 'Thêm người dùng thành công!',
            'user' => $user
        ], 201);
    }

    /**
     * Xem thông tin chi tiết của một người dùng
     * GET /api/users/{id}
     */
    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy người dùng!'], 404);
        }

        return response()->json($user);
    }

    /**
     * Cập nhật thông tin người dùng
     * PUT /api/users/{id}
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy người dùng!'], 404);
        }
        
        // Cần có logic kiểm tra quyền ở middleware hoặc tại đây.

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'username' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('users')->ignore($id),
            ],
            'phone_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'profile_image_url' => 'nullable|url|max:2048',
            'password' => 'nullable|string|min:6|confirmed', 
            'role' => 'sometimes|string|in:admin,user',
        ]);

        $updateData = $request->only(['name', 'username', 'phone_number', 'address', 'profile_image_url', 'role']);
        
        // Xử lý mật khẩu
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'Cập nhật người dùng thành công!',
            'user' => $user->only(['id', 'name', 'username', 'phone_number', 'address', 'profile_image_url', 'role'])
        ]);
    }

    /**
     * Xóa người dùng (Admin only)
     * DELETE /api/users/{id}
     */
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy người dùng!'], 404);
        }
        
        // Cần có logic kiểm tra quyền 'admin' ở middleware hoặc tại đây.

        $user->delete();

        return response()->json(['message' => 'Xóa người dùng thành công!']);
    }
    
    /**
     * Xử lý tải ảnh profile lên server
     * POST /api/users/upload-profile-image (Cần Auth)
     */
    public function uploadProfileImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg|max:2048', 
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $user = $request->user();
            
            $path = 'profile_images/' . $user->id; 
            $fileName = time() . '_' . $file->getClientOriginalName();
            
            // HINT TYPE cho Intelephense bằng docblock
            /** @var Filesystem $disk */ 
            $disk = Storage::disk('public');

            // Gọi phương thức putFileAs trên đối tượng đã hint kiểu
            $filePath = $disk->putFileAs($path, $file, $fileName); 

            if ($filePath) {
                $url = Storage::url($filePath); 
                
                return response()->json([
                    'success' => true,
                    'message' => 'Tải ảnh lên thành công.',
                    'url' => url($url), 
                ], 200);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Không thể lưu trữ tệp tin.'
        ], 500);
    }
    public function getProfileImageUrl(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            // Trường hợp người dùng chưa đăng nhập hoặc token hết hạn
            return response()->json(['message' => 'Yêu cầu cần xác thực.'], 401);
        }

        // Trả về chỉ URL ảnh profile. Nếu chưa có ảnh, giá trị sẽ là null.
        return response()->json([
            'profile_image_url' => $user->profile_image_url,
        ]);
    }
}