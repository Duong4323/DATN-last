<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Xóa hết dữ liệu cũ (nếu muốn reset)
        User::truncate();

        // Tạo tài khoản admin
        User::create([
            'name' => 'Quản trị viên',
            'username' => 'admin',
            'password' => Hash::make('123456'),
            'role' => 'admin',
        ]);

        // Tạo tài khoản user thường
        User::create([
            'name' => 'Người dùng',
            'username' => 'user',
            'password' => Hash::make('123456'),
            'role' => 'user',
        ]);
    }
}
