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
        // Danh sách TÊN Categories mẫu
        $categoryNames = [
            'áo', 'quần', 'váy', 'Đồ đông', 'Đồ hè', 'Đồ nam', 'Đồ nữ', 
            'Đồ ngủ', 'Đồ lót', 'áo khoác', 'Đồ thể thao', 'Đồ công sở',
        ];

        $categories = [];
        $id = 1;

        foreach ($categoryNames as $name) {
            $categories[] = [
                'id' => $id++, 
                'name' => $name,
                'slug' => Str::slug($name), 
                'created_at' => now(), 
                'updated_at' => now(),
            ];
        }

        // --- ĐÃ LOẠI BỎ LỆNH DB::statement('SET FOREIGN_KEY_CHECKS=0;') ---
        
        // Chèn dữ liệu cố định (đảm bảo ID từ 1 đến 12)
        DB::table('categories')->insert($categories);
        DB::statement("SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));");
    }
}