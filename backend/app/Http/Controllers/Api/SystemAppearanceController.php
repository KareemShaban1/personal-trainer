<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
}
