<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

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
            'pwa_name' => 'Trainer SaaS',
            'pwa_short_name' => 'Trainer',
            'pwa_icon' => null,
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
        $data = Cache::remember('system_settings.appearance', 300, function () {
            $row = static::query()->where('key', self::APPEARANCE_KEY)->first();

            return array_merge(self::defaultAppearance(), $row?->value ?? []);
        });

        $data = array_merge(self::defaultAppearance(), is_array($data) ? $data : []);
        $data['pwa_icon_url'] = self::pwaIconUrl($data['pwa_icon'] ?? null);

        return $data;
    }

    public static function putAppearance(array $value): array
    {
        unset($value['pwa_icon_url']);

        $existing = static::query()->where('key', self::APPEARANCE_KEY)->value('value') ?? [];
        if (! is_array($existing)) {
            $existing = [];
        }

        $merged = array_merge(self::defaultAppearance(), $existing, $value);

        static::query()->updateOrCreate(
            ['key' => self::APPEARANCE_KEY],
            ['value' => $merged],
        );

        Cache::forget('system_settings.appearance');

        return self::appearance();
    }

    public static function pwaIconUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return Storage::disk('public')->url($path);
    }
}
