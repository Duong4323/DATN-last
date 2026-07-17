<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Danh sách loại sản phẩm phù hợp với website thời trang.
        $categoryNames = [
            'Áo',
            'Quần',
            'Váy/Đầm',
            'Giày dép',
            'Túi xách',
            'Phụ kiện',
            'Set đồ',
            'Đồ ngủ',
            'Đồ lót',
            'Áo khoác',
            'Đồ thể thao',
            'Đồ công sở',
        ];

        $id = 1;

        foreach ($categoryNames as $name) {
            DB::table('categories')->updateOrInsert(
                ['id' => $id++],
                [
                    'name' => $name,
                    'slug' => Str::slug($name),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        DB::statement("SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));");
    }
}
