<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trainees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->text('medical_notes')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->unique(['organization_id', 'user_id']);
            $table->unique(['organization_id', 'code']);
        });

        Schema::create('parents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->unique(['organization_id', 'user_id']);
        });

        Schema::create('parent_trainee', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('parents')->cascadeOnDelete();
            $table->foreignId('trainee_id')->constrained('trainees')->cascadeOnDelete();
            $table->string('relationship')->nullable();
            $table->timestamps();

            $table->unique(['parent_id', 'trainee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_trainee');
        Schema::dropIfExists('parents');
        Schema::dropIfExists('trainees');
    }
};
