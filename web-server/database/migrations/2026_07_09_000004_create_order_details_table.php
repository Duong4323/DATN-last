<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name');
            $table->string('color')->nullable();
            $table->string('size')->nullable();
            $table->unsignedInteger('quantity');
            $table->unsignedBigInteger('price');
            $table->timestamps();

            $table->index('order_id', 'order_details_order_id_idx');
            $table->index('product_id', 'order_details_product_id_idx');
        });

        $now = now();
        DB::table('orders')
            ->select('id', 'order_details')
            ->orderBy('id')
            ->chunkById(100, function ($orders) use ($now) {
                foreach ($orders as $order) {
                    $items = is_string($order->order_details)
                        ? json_decode($order->order_details, true)
                        : $order->order_details;

                    if (!is_array($items)) {
                        continue;
                    }

                    $rows = collect($items)
                        ->filter(fn ($item) => is_array($item))
                        ->map(fn ($item) => [
                            'order_id' => $order->id,
                            'product_id' => $item['product_id'] ?? null,
                            'product_name' => $item['product_name'] ?? 'Sản phẩm',
                            'color' => $item['color'] ?? null,
                            'size' => $item['size'] ?? null,
                            'quantity' => max(1, (int) ($item['quantity'] ?? 1)),
                            'price' => round((float) ($item['price'] ?? 0)),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ])
                        ->values()
                        ->all();

                    if (!empty($rows)) {
                        DB::table('order_details')->insert($rows);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_details');
    }
};
