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
        // 1. Tạo bảng Đơn hàng (orders)
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            
            // Khóa ngoại liên kết với bảng users (người mua)
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Tổng thành tiền của đơn hàng
            $table->unsignedBigInteger('total_amount')->default(0);
            
            // 💡 Cột mới: Lưu chi tiết sản phẩm (tên, số lượng, giá) dưới dạng JSON
            // Ví dụ: [{"product_name": "Áo A", "quantity": 1, "price": 500000}, ...]
            $table->json('order_details'); 

            // Trạng thái Đơn hàng: [chưa xử lý, đã xác nhận, đang giao, đã giao, đã hủy]
            $table->enum('status', ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'])->default('pending');

            // Trạng thái Thanh toán: [chưa thanh toán, đã thanh toán, đã hoàn tiền]
            $table->enum('payment_status', ['unpaid', 'paid', 'refunded'])->default('unpaid');

            // Địa chỉ giao hàng cố định tại thời điểm đặt hàng
            $table->string('shipping_address', 500); 

            $table->timestamps();
        });
    }

    /**
     * Hoàn tác migration (Xóa bảng).
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};