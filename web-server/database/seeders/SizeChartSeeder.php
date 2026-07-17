<?php

namespace Database\Seeders;

use App\Models\SizeChart;
use Illuminate\Database\Seeder;

class SizeChartSeeder extends Seeder
{
    public function run(): void
    {
        $rows = array_merge(
            $this->apparelRows(1, 'ao'),
            $this->apparelRows(2, 'quan'),
            $this->apparelRows(3, 'vay_dam'),
            $this->apparelRows(7, 'set_do'),
            $this->apparelRows(8, 'do_ngu'),
            $this->apparelRows(10, 'ao_khoac'),
            $this->apparelRows(11, 'do_the_thao'),
            $this->apparelRows(12, 'do_cong_so'),
            $this->shoeRows(4)
        );

        foreach ($rows as $row) {
            SizeChart::updateOrCreate(
                [
                    'category_id' => $row['category_id'],
                    'product_type' => $row['product_type'],
                    'gender' => $row['gender'] ?? null,
                    'size' => $row['size'],
                ],
                array_merge($row, ['updated_at' => now(), 'created_at' => now()])
            );
        }
    }

    private function apparelRows(int $categoryId, string $productType): array
    {
        return [
            [
                'category_id' => $categoryId,
                'product_type' => $productType,
                'gender' => 'unisex',
                'size' => 'S',
                'min_height_cm' => 150,
                'max_height_cm' => 160,
                'min_weight_kg' => 40,
                'max_weight_kg' => 50,
                'min_chest_cm' => 78,
                'max_chest_cm' => 86,
                'min_waist_cm' => 60,
                'max_waist_cm' => 68,
                'min_hip_cm' => 82,
                'max_hip_cm' => 90,
                'note' => 'Phù hợp dáng nhỏ.',
            ],
            [
                'category_id' => $categoryId,
                'product_type' => $productType,
                'gender' => 'unisex',
                'size' => 'M',
                'min_height_cm' => 158,
                'max_height_cm' => 168,
                'min_weight_kg' => 48,
                'max_weight_kg' => 58,
                'min_chest_cm' => 84,
                'max_chest_cm' => 92,
                'min_waist_cm' => 66,
                'max_waist_cm' => 74,
                'min_hip_cm' => 88,
                'max_hip_cm' => 96,
                'note' => 'Phù hợp vóc dáng trung bình.',
            ],
            [
                'category_id' => $categoryId,
                'product_type' => $productType,
                'gender' => 'unisex',
                'size' => 'L',
                'min_height_cm' => 166,
                'max_height_cm' => 176,
                'min_weight_kg' => 56,
                'max_weight_kg' => 68,
                'min_chest_cm' => 90,
                'max_chest_cm' => 100,
                'min_waist_cm' => 72,
                'max_waist_cm' => 82,
                'min_hip_cm' => 94,
                'max_hip_cm' => 104,
                'note' => 'Phù hợp dáng cao hoặc thích mặc thoải mái.',
            ],
            [
                'category_id' => $categoryId,
                'product_type' => $productType,
                'gender' => 'unisex',
                'size' => 'XL',
                'min_height_cm' => 174,
                'max_height_cm' => 184,
                'min_weight_kg' => 66,
                'max_weight_kg' => 78,
                'min_chest_cm' => 98,
                'max_chest_cm' => 108,
                'min_waist_cm' => 80,
                'max_waist_cm' => 92,
                'min_hip_cm' => 102,
                'max_hip_cm' => 112,
                'note' => 'Phù hợp dáng lớn hoặc form rộng.',
            ],
        ];
    }

    private function shoeRows(int $categoryId): array
    {
        return collect([
            ['size' => '38', 'min' => 23.5, 'max' => 24.0],
            ['size' => '39', 'min' => 24.1, 'max' => 24.5],
            ['size' => '40', 'min' => 24.6, 'max' => 25.0],
            ['size' => '41', 'min' => 25.1, 'max' => 25.5],
            ['size' => '42', 'min' => 25.6, 'max' => 26.0],
            ['size' => '43', 'min' => 26.1, 'max' => 26.5],
        ])->map(fn ($row) => [
            'category_id' => $categoryId,
            'product_type' => 'giay_dep',
            'gender' => 'unisex',
            'size' => $row['size'],
            'min_foot_length_cm' => $row['min'],
            'max_foot_length_cm' => $row['max'],
            'note' => 'Chọn theo chiều dài bàn chân.',
        ])->toArray();
    }
}
