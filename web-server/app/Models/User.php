<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Product;
use App\Models\Shop;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'phone_number',
        'address',
        'profile_image_url',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'role' => 'string',
    ];

    /**
     * Giỏ hàng
     */
    public function productsInCart(): BelongsToMany
    {
        return $this->belongsToMany(
            Product::class,
            'carts',
            'user_id',
            'product_id'
        )
        ->withPivot('quantity')
        ->withTimestamps();
    }

    /**
     * Shop của chủ cửa hàng
     */
    public function shop(): HasOne
    {
        return $this->hasOne(Shop::class, 'user_id');
    }

    /**
     * Kiểm tra quyền Admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Kiểm tra quyền Chủ cửa hàng
     */
    public function isShopOwner(): bool
    {
        return $this->role === 'shop_owner';
    }
}