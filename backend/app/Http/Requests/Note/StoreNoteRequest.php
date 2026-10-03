<?php

namespace App\Http\Requests\Note;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notable_type' => ['required', 'string'],
            'notable_id' => ['required', 'integer'],
            'body' => ['required', 'string'],
            'visibility' => ['sometimes', 'in:internal,shared_with_parent,private'],
        ];
    }
}