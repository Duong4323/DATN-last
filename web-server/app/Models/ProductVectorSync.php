<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVectorSync extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'qdrant_point_id',
        'collection',
        'embedding_model',
        'content_hash',
        'search_text',
        'synced_at',
    ];

    protected $casts = [
        'synced_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
