<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopMonthlyStatistic extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'month',
        'total_orders',
        'pending_orders',
        'completed_orders',
        'sold_products',
        'revenue',
    ];

    protected $casts = [
        'revenue' => 'float',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
