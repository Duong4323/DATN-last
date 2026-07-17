<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variant_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('color')->nullable();
            $table->string('size')->nullable();
            $table->unsignedInteger('quantity')->default(0);
            $table->timestamps();

            $table->unique(['product_id', 'color', 'size'], 'product_variant_stocks_unique_variant');
            $table->index(['product_id', 'color'], 'product_variant_stocks_product_color_idx');
            $table->index(['product_id', 'size'], 'product_variant_stocks_product_size_idx');
        });

        $now = now();
        DB::table('products')
            ->select('id', 'size_details')
            ->orderBy('id')
            ->chunkById(100, function ($products) use ($now) {
                foreach ($products as $product) {
                    $details = is_string($product->size_details)
                        ? json_decode($product->size_details, true)
                        : $product->size_details;

                    if (!is_array($details)) {
                        continue;
                    }

                    $rows = [];
                    foreach ($details as $colorOrSize => $value) {
                        if (is_array($value)) {
                            foreach ($value as $size => $quantity) {
                                $rows[] = [
                                    'product_id' => $product->id,
                                    'color' => in_array($colorOrSize, ['Mặc định', 'Mac dinh'], true) ? null : $colorOrSize,
                                    'size' => in_array($size, ['Không size', 'Khong size'], true) ? null : $size,
                                    'quantity' => max(0, (int) $quantity),
                                    'created_at' => $now,
                                    'updated_at' => $now,
                                ];
                            }
                            continue;
                        }

                        $rows[] = [
                            'product_id' => $product->id,
                            'color' => null,
                            'size' => in_array($colorOrSize, ['Không size', 'Khong size'], true) ? null : $colorOrSize,
                            'quantity' => max(0, (int) $value),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    if (!empty($rows)) {
                        DB::table('product_variant_stocks')->insert($rows);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variant_stocks');
    }
};
