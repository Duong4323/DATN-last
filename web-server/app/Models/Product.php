<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Shop;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'name',
        'brand',
        'colors',
        'material',
        'origin',
        'design_style',
        'fashion_style',
        'description',
        'price',
        'size_details',
        'quantity',
        'sold',
    ];

    protected $casts = [
        'size_details' => 'array',
        'colors' => 'array',
    ];

    protected $appends = [
        'remaining',
        'thumbnail_url',
        'available_sizes',
        'available_colors',
        'shop_name',
    ];

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function categories()
    {
        return $this->belongsToMany(
            Category::class,
            'category_product',
            'product_id',
            'category_id'
        );
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function variantStocks()
    {
        return $this->hasMany(ProductVariantStock::class);
    }

    public function getShopNameAttribute()
{
    $shop = $this->shop;
    return $shop ? $shop->name : null;
}

    public function getAvailableSizesAttribute()
    {
        if ($this->relationLoaded('variantStocks') || $this->variantStocks()->exists()) {
            return $this->variantStocks
                ->filter(fn ($variant) => (int) $variant->quantity > 0 && filled($variant->size))
                ->pluck('size')
                ->unique()
                ->values()
                ->toArray();
        }

        if (!$this->size_details) {
            return [];
        }

        return collect($this->size_details)
            ->flatMap(function ($value, $key) {
                if (is_array($value)) {
                    return collect($value)
                        ->filter(fn ($qty) => (int) $qty > 0)
                        ->keys();
                }

                return (int) $value > 0 ? [$key] : [];
            })
            ->unique()
            ->values()
            ->toArray();
    }

    public function getAvailableColorsAttribute()
    {
        if ($this->relationLoaded('variantStocks') || $this->variantStocks()->exists()) {
            return $this->variantStocks
                ->filter(fn ($variant) => (int) $variant->quantity > 0 && filled($variant->color))
                ->pluck('color')
                ->unique()
                ->values()
                ->toArray();
        }

        if (!$this->size_details) {
            return [];
        }

        return collect($this->size_details)
            ->filter(fn ($value) => is_array($value) && collect($value)->sum() > 0)
            ->keys()
            ->values()
            ->toArray();
    }

    public function getRemainingAttribute()
    {
        return max(0, (int) $this->quantity);
    }

    public function getSizeDetailsAttribute($value)
    {
        if ($this->relationLoaded('variantStocks') || $this->variantStocks()->exists()) {
            $variants = $this->relationLoaded('variantStocks')
                ? $this->variantStocks
                : $this->variantStocks()->get();

            return $variants->reduce(function (array $stock, ProductVariantStock $variant) {
                $color = $variant->color ?: 'Mặc định';
                $size = $variant->size ?: 'Không size';
                $stock[$color][$size] = (int) $variant->quantity;

                return $stock;
            }, []);
        }

        return $this->casts['size_details'] === 'array' && is_string($value)
            ? json_decode($value, true)
            : $value;
    }

    public function getThumbnailUrlAttribute()
    {
        $thumbnail = $this->images()
            ->where('is_thumbnail', true)
            ->first() ?? $this->images()->first();

        return $thumbnail ? $thumbnail->url : null;
    }

    protected static function booted()
    {
        static::saving(function ($product) {
            $rawSizeDetails = $product->getRawOriginal('size_details') ?? $product->attributes['size_details'] ?? null;
            $sizeDetails = is_string($rawSizeDetails) ? json_decode($rawSizeDetails, true) : $rawSizeDetails;

            if ($sizeDetails) {
                $product->quantity = collect($sizeDetails)->sum(function ($value) {
                    return is_array($value) ? collect($value)->sum() : (int) $value;
                });
            }
        });
    }
}
