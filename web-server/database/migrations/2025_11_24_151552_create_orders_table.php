<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Chạy migration để tạo bảng.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {

            $table->id();

            // Người mua
            $table->foreignId('user_id')
                ->constrained()
                ->onDelete('cascade');

            // Shop nhận đơn
            $table->foreignId('shop_id')
                ->constrained('shops')
                ->onDelete('cascade');

            // Tổng tiền
            $table->unsignedBigInteger('total_amount')
                ->default(0);

            /**
             * Ví dụ:
             * [
             *   {
             *     "product_id":1,
             *     "product_name":"Áo Polo",
             *     "quantity":2,
             *     "price":300000,
             *     "size":"L"
             *   }
             * ]
             */
            $table->json('order_details');

            // Trạng thái đơn hàng
            $table->enum('status', [
                'pending',
                'confirmed',
                'shipping',
                'delivered',
                'cancelled',
                'returned'
            ])->default('pending');

            // Trạng thái thanh toán
            $table->enum('payment_status', [
                'unpaid',
                'paid',
                'refunded'
            ])->default('unpaid');

            // Địa chỉ giao hàng
            $table->string('shipping_address', 500);

            $table->timestamps();
        });
    }

    /**
     * Hoàn tác migration
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};