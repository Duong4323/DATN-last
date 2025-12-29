<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'total_amount',
        'order_details', // <-- Chứa mảng JSON chi tiết sản phẩm
        'status',
        'payment_status',
        'shipping_address',
    ];

    /**
     * Thuộc tính sẽ được tự động chuyển đổi.
     * Cột 'order_details' được cast thành 'array' để dễ dàng truy cập trong PHP.
     */
    protected $casts = [
        'order_details' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // --- RELATIONSHIPS ---

    /**
     * Định nghĩa mối quan hệ: Một đơn hàng thuộc về một người dùng (Người mua).
     * Mối quan hệ này dùng để lấy thông tin người mua (user_id).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}