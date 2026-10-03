<?php

namespace App\Http\Requests\Progress;

use Illuminate\Foundation\Http\FormRequest;

class StoreProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'trainee_id' => ['required', 'integer', 'exists:trainees,id'],
            'notes' => ['nullable', 'string'],
            'recorded_at' => ['nullable', 'date'],
            'skills' => ['nullable', 'array'],
            'skills.*.skill_category_id' => ['nullable', 'integer', 'exists:skill_categories,id'],
            'skills.*.skill_name' => ['required_with:skills', 'string', 'max:255'],
            'skills.*.rating' => ['nullable', 'integer', 'min:1', 'max:10'],
            'skills.*.notes' => ['nullable', 'string'],
        ];
    }
}