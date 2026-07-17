<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('design_style')->nullable()->after('origin');
            $table->string('fashion_style')->nullable()->after('design_style');

            $table->index('shop_id', 'products_shop_id_idx');
            $table->index('price', 'products_price_idx');
            $table->index('sold', 'products_sold_idx');
            $table->index('created_at', 'products_created_at_idx');
            $table->index('brand', 'products_brand_idx');
            $table->index('material', 'products_material_idx');
            $table->index('design_style', 'products_design_style_idx');
            $table->index('fashion_style', 'products_fashion_style_idx');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_shop_id_idx');
            $table->dropIndex('products_price_idx');
            $table->dropIndex('products_sold_idx');
            $table->dropIndex('products_created_at_idx');
            $table->dropIndex('products_brand_idx');
            $table->dropIndex('products_material_idx');
            $table->dropIndex('products_design_style_idx');
            $table->dropIndex('products_fashion_style_idx');
            $table->dropColumn(['design_style', 'fashion_style']);
        });
    }
};
