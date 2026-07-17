<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->string('color')->nullable()->after('size');
            $table->dropUnique(['user_id', 'product_id', 'size']);
            $table->unique(['user_id', 'product_id', 'size', 'color']);
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'product_id', 'size', 'color']);
            $table->unique(['user_id', 'product_id', 'size']);
            $table->dropColumn('color');
        });
    }
};
