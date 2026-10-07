<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SystemAppearanceController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'appearance' => SystemSetting::appearance(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $data = $request->validate([
            'brand_name' => ['sometimes', 'string', 'min:2', 'max:80'],
            'pwa_name' => ['sometimes', 'string', 'min:2', 'max:80'],
            'pwa_short_name' => ['sometimes', 'string', 'min:2', 'max:20'],
            'primary' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'primary_dark' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'primary_light' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'accent' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'surface' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'ink' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'border' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'font_sans' => ['sometimes', 'string', 'max:80'],
            'font_arabic' => ['sometimes', 'string', 'max:80'],
            'font_size_base' => ['sometimes', 'string', 'max:20'],
            'border_radius' => ['sometimes', 'string', 'max:20'],
        ]);

        return response()->json([
            'message' => 'Appearance settings updated.',
            'appearance' => SystemSetting::putAppearance($data),
        ]);
    }

    public function uploadPwaIcon(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $request->validate([
            'icon' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        $current = SystemSetting::appearance();
        $previous = $current['pwa_icon'] ?? null;

        $path = $request->file('icon')->store('system', 'public');

        if (is_string($previous) && $previous !== '' && Storage::disk('public')->exists($previous)) {
            Storage::disk('public')->delete($previous);
        }

        return response()->json([
            'message' => 'PWA icon updated.',
            'appearance' => SystemSetting::putAppearance([
                'pwa_icon' => $path,
            ]),
        ]);
    }

    public function clearPwaIcon(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $current = SystemSetting::appearance();
        $previous = $current['pwa_icon'] ?? null;

        if (is_string($previous) && $previous !== '' && Storage::disk('public')->exists($previous)) {
            Storage::disk('public')->delete($previous);
        }

        return response()->json([
            'message' => 'PWA icon cleared.',
            'appearance' => SystemSetting::putAppearance([
                'pwa_icon' => null,
            ]),
        ]);
    }
}
