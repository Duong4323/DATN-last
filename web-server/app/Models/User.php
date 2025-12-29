<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Product;

/**
 * @method \Illuminate\Database\Relations\BelongsToMany productsInCart()
 */
class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'phone_number', // Đã thêm
        'address',      // Đã thêm
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
     * Quan hệ many-to-many giữa user và product qua bảng carts
     */
    public function productsInCart(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'carts', 'user_id', 'product_id')
                    ->withPivot('quantity')
                    ->withTimestamps();
    }
}