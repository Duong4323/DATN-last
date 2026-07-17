<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SizeChart extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'product_type',
        'gender',
        'size',
        'min_height_cm',
        'max_height_cm',
        'min_weight_kg',
        'max_weight_kg',
        'min_chest_cm',
        'max_chest_cm',
        'min_waist_cm',
        'max_waist_cm',
        'min_hip_cm',
        'max_hip_cm',
        'min_foot_length_cm',
        'max_foot_length_cm',
        'note',
    ];

    protected $casts = [
        'min_height_cm' => 'float',
        'max_height_cm' => 'float',
        'min_weight_kg' => 'float',
        'max_weight_kg' => 'float',
        'min_chest_cm' => 'float',
        'max_chest_cm' => 'float',
        'min_waist_cm' => 'float',
        'max_waist_cm' => 'float',
        'min_hip_cm' => 'float',
        'max_hip_cm' => 'float',
        'min_foot_length_cm' => 'float',
        'max_foot_length_cm' => 'float',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
