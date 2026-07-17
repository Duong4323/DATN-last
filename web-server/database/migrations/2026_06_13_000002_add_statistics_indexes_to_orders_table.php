<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['shop_id', 'created_at'], 'orders_shop_created_at_idx');
            $table->index(['shop_id', 'status', 'payment_status'], 'orders_shop_status_payment_idx');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_shop_created_at_idx');
            $table->dropIndex('orders_shop_status_payment_idx');
        });
    }
};
