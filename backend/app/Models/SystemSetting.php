<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    public const APPEARANCE_KEY = 'appearance';

    protected $fillable = [
        'key',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    public static function defaultAppearance(): array
    {
        return [
            'brand_name' => 'Trainer SaaS',
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
        ];
    }

    public static function appearance(): array
    {
        return Cache::remember('system_settings.appearance', 300, function () {
            $row = static::query()->where('key', self::APPEARANCE_KEY)->first();

            return array_merge(self::defaultAppearance(), $row?->value ?? []);
        });
    }

    public static function putAppearance(array $value): array
    {
        $merged = array_merge(self::defaultAppearance(), $value);

        static::query()->updateOrCreate(
            ['key' => self::APPEARANCE_KEY],
            ['value' => $merged],
        );

        Cache::forget('system_settings.appearance');

        return self::appearance();
    }
}
