<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tạo bảng 'carts' đơn lẻ, kết hợp các cột cần thiết cho giỏ hàng.
     */
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            
            // Khóa ngoại liên kết với Người dùng
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Khóa ngoại liên kết với Sản phẩm
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            
            // CỘT QUAN TRỌNG: Lưu số lượng (quantity)
            $table->unsignedSmallInteger('quantity')->default(1);
            
            $table->timestamps();
            
            // Đảm bảo mỗi người dùng chỉ có một mục nhập cho mỗi sản phẩm
            $table->unique(['user_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};