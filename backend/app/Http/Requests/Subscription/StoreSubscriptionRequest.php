<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'trainee_id' => ['required', 'integer', 'exists:trainees,id'],
            'package_id' => ['required', 'integer', 'exists:packages,id'],
            'started_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}