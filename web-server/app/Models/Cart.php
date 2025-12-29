<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    use HasFactory;

    protected $table = 'carts'; // Đã đặt tên bảng chính xác

    protected $fillable = [
        'user_id',
        'product_id',
        'quantity',
    ];
    
    // Nếu bạn không muốn Eloquent cố gắng tìm cột ID tự động, bạn có thể thiết lập:
    // protected $primaryKey = null; 
    // public $incrementing = false; 

    // Quan hệ với User (giữ nguyên)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    // Quan hệ với Product (giữ nguyên)
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}