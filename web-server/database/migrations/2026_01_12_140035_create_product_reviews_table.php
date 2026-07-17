<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            
            // Khóa ngoại liên kết
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            
            // Dữ liệu đánh giá
            $table->tinyInteger('rating')->comment('Số sao từ 1-5');
            $table->text('comment')->nullable()->comment('Nội dung bình luận');
            $table->string('image_url')->nullable()->comment('Ảnh minh họa nếu có');
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('product_reviews');
    }
};