<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {

            $table->id();

            // Cửa hàng sở hữu sản phẩm
            $table->foreignId('shop_id')
                ->constrained('shops')
                ->onDelete('cascade');

            $table->string('name');

            // Thương hiệu
            $table->string('brand')->nullable();

            // Màu sắc
            $table->json('colors')->nullable();

            // Chất liệu
            $table->string('material')->nullable();

            // Xuất xứ
            $table->string('origin')->nullable();

            $table->text('description')->nullable();

            $table->decimal('price', 15, 2)
                ->default(0);

            /**
             * Ví dụ:
             * {
             *   "S": 50,
             *   "M": 100,
             *   "L": 0
             * }
             */
            $table->json('size_details')
                ->nullable();

            // Tổng số lượng
            $table->integer('quantity')
                ->default(0);

            // Đã bán
            $table->integer('sold')
                ->default(0);

            // Ảnh đại diện cũ (nếu còn dùng)
            $table->string('image_url')
                ->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};