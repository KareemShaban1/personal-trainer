<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'attendance_date' => ['nullable', 'date'],
            'records' => ['required', 'array', 'min:1'],
            'records.*.trainee_id' => ['required', 'integer', 'exists:trainees,id'],
            'records.*.subscription_id' => ['nullable', 'integer', 'exists:subscriptions,id'],
            'records.*.status' => ['required', 'in:present,absent,late,excused'],
            'records.*.notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
