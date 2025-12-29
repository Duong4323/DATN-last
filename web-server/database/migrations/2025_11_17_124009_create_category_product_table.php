<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCategoryProductTable extends Migration
{
   public function up(): void
    {
        Schema::create('category_product', function (Blueprint $table) {
            // Khóa ngoại cho Category
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            // Khóa ngoại cho Product
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            
            // Đặt cả hai làm khóa chính để đảm bảo sự kết hợp là duy nhất
            $table->primary(['category_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('category_product');
    }
}
