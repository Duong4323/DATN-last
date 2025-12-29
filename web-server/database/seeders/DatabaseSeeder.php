<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            // Giữ lại UserSeeder
            UserSeeder::class,
            // THÊM: CategorySeeder để điền dữ liệu cho bảng categories
            CategorySeeder::class,
        ]);
    }
}