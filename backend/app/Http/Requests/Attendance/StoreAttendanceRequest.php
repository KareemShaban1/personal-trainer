<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'trainee_id' => ['required', 'integer', 'exists:trainees,id'],
            'subscription_id' => ['required', 'integer', 'exists:subscriptions,id'],
            'status' => ['required', 'in:present,absent,late,excused'],
            'attendance_date' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
        ];
    }
}