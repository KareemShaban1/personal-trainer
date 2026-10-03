<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->timestamps();
        });

        DB::table('system_settings')->insert([
            'key' => 'appearance',
            'value' => json_encode([
                'primary' => '#0f7473',
                'primary_dark' => '#0d5c5c',
                'primary_light' => '#3aadaa',
                'accent' => '#c45c26',
                'surface' => '#f4f7f8',
                'ink' => '#0f172a',
                'border' => '#d9e3e6',
                'font_sans' => 'DM Sans',
                'font_arabic' => 'IBM Plex Sans Arabic',
                'font_size_base' => '16px',
                'border_radius' => '0.75rem',
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
