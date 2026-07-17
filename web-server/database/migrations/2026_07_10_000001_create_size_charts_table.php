<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('size_charts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('product_type')->nullable();
            $table->string('gender')->nullable();
            $table->string('size', 20);
            $table->decimal('min_height_cm', 5, 1)->nullable();
            $table->decimal('max_height_cm', 5, 1)->nullable();
            $table->decimal('min_weight_kg', 5, 1)->nullable();
            $table->decimal('max_weight_kg', 5, 1)->nullable();
            $table->decimal('min_chest_cm', 5, 1)->nullable();
            $table->decimal('max_chest_cm', 5, 1)->nullable();
            $table->decimal('min_waist_cm', 5, 1)->nullable();
            $table->decimal('max_waist_cm', 5, 1)->nullable();
            $table->decimal('min_hip_cm', 5, 1)->nullable();
            $table->decimal('max_hip_cm', 5, 1)->nullable();
            $table->decimal('min_foot_length_cm', 5, 1)->nullable();
            $table->decimal('max_foot_length_cm', 5, 1)->nullable();
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['category_id', 'size'], 'size_charts_category_size_idx');
            $table->index(['product_type', 'size'], 'size_charts_type_size_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('size_charts');
    }
};
