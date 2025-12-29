<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('username')->unique();
            $table->string('phone_number')->nullable(); // Thêm cột số điện thoại
            $table->string('address')->nullable();      // Thêm cột địa chỉ
            
            // THÊM TRƯỜNG MỚI ĐỂ LƯU ẢNH NGƯỜI DÙNG
            $table->string('profile_image_url')->nullable(); 
            
            $table->string('password');
            $table->enum('role', ['admin', 'user'])->default('user');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};