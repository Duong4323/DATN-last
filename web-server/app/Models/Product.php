<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        // 'image_url' đã bị loại bỏ vì giờ dùng quan hệ images()
        'description',
        'price',
        'quantity',
        'sold',
    ];

    // Thêm thuộc tính ảo 'remaining' và 'thumbnail_url'
    protected $appends = ['remaining', 'thumbnail_url'];

    // ----------------------------------------------------
    // RELATIONS (QUAN HỆ)
    // ----------------------------------------------------

    /**
     * Quan hệ One-to-Many với ProductImage.
     * Một sản phẩm có nhiều ảnh.
     */
    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    /**
     * Quan hệ Many-to-Many với Category (Giữ nguyên)
     */
    public function categories()
    {
        return $this->belongsToMany(Category::class, 'category_product', 'product_id', 'category_id');
    }

    // ----------------------------------------------------
    // ACCESSORS (THUỘC TÍNH ẢO)
    // ----------------------------------------------------

    /**
     * Accessor để tính số lượng sản phẩm còn lại.
     */
    public function getRemainingAttribute()
    {
        return max(0, (int)$this->quantity - (int)$this->sold);
    }

    /**
     * Accessor để lấy URL của ảnh đại diện (Thumbnail).
     * Sẽ tìm ảnh được đánh dấu là thumbnail hoặc ảnh đầu tiên.
     */
    public function getThumbnailUrlAttribute()
    {
        // Ưu tiên lấy ảnh có cờ is_thumbnail = true
        $thumbnail = $this->images()->where('is_thumbnail', true)->first();
        
        // Nếu không có, lấy ảnh đầu tiên
        if (!$thumbnail) {
            $thumbnail = $this->images()->first();
        }

        // Trả về URL của ảnh đại diện hoặc NULL
        return $thumbnail ? $thumbnail->url : null;
    }
}