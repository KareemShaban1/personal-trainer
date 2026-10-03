<?php

namespace App\Http\Requests\Organization;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'check_in_radius_meters' => ['sometimes', 'integer', 'min:10', 'max:5000'],
            'require_geolocation' => ['sometimes', 'boolean'],
            'attendance_qr_ttl_seconds' => ['sometimes', 'integer', 'min:30', 'max:3600'],
            'settings' => ['sometimes', 'array'],
        ];
    }
}