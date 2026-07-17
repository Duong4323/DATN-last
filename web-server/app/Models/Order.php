<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Shop;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'shop_id',
        'total_amount',
        'order_details',
        'status',
        'payment_status',
        'shipping_address',
    ];

    protected $casts = [
        'order_details' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Người mua
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Shop nhận đơn
     */
    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function details()
    {
        return $this->hasMany(OrderDetail::class);
    }
}
