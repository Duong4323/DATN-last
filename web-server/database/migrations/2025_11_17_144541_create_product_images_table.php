<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            // Khóa ngoại liên kết với bảng products
            $table->foreignId('product_id')->constrained()->onDelete('cascade'); 
            // Đường dẫn URL đến file ảnh
            $table->string('url'); 
            // Cờ (flag) để đánh dấu ảnh đại diện (thumbnail)
            $table->boolean('is_thumbnail')->default(false); 
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_images');
    }
};