<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skill_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['organization_id', 'name']);
        });

        Schema::create('progress_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trainee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['organization_id', 'trainee_id']);
        });

        Schema::create('progress_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('progress_record_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('skill_name');
            $table->unsignedTinyInteger('rating')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->morphs('notable');
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->string('visibility', 30)->default('internal');
            $table->timestamps();

            $table->index(['organization_id', 'visibility']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
        Schema::dropIfExists('progress_skills');
        Schema::dropIfExists('progress_records');
        Schema::dropIfExists('skill_categories');
    }
};
