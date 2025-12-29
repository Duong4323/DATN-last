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
            $table->string('name');                     // Tên sản phẩm
            $table->text('description')->nullable();    // Mô tả
            $table->string('category')->nullable();     // Loại sản phẩm
            $table->decimal('price', 15, 2)->default(0);// Giá sản phẩm
            $table->integer('quantity')->default(0);    // Tổng số lượng
            $table->integer('sold')->default(0);        // Số lượng đã bán
            $table->string('image_url')->nullable();    // Ảnh sản phẩm (URL)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
