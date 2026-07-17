<?php

namespace App\Http\Controllers\Api\Products;

use App\Http\Controllers\Controller;
use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(
            Category::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            200
        );
    }
}
